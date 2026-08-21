"""
ORB + ratio test + RANSAC matching pipeline.

This is a direct implementation of Technical Architecture Section 2's
validated pipeline - not a reinterpretation of it:

    1. Extract ORB keypoints/descriptors from the uploaded photo
    2. For each candidate reference photo: knnMatch (k=2) -> ratio test
       (discard ambiguous matches) -> RANSAC geometric verification
       (discard matches not spatially consistent with a real camera-angle
       transformation)
    3. The surviving "inlier" count is the confidence score for that
       reference photo

No GPU, no ML training, no vision API - matches Tech Arch Section 1/10.
"""
from __future__ import annotations

import pickle
from dataclasses import dataclass

import cv2
import numpy as np

# Ratio test threshold (Lowe's ratio test) - the best match must be
# unambiguously better than the second-best to survive. 0.75 is the
# standard starting point for this technique; not called out as a
# separately-tuned value in the source docs, so kept as the conventional
# default rather than invented.
RATIO_TEST_THRESHOLD = 0.75

# Minimum raw (pre-RANSAC) matches required before even attempting a
# homography fit - findHomography needs at least 4 point correspondences.
MIN_MATCHES_FOR_RANSAC = 4

# RANSAC reprojection error threshold, in pixels.
RANSAC_REPROJ_THRESHOLD = 5.0

_orb = cv2.ORB_create(nfeatures=1500)


@dataclass
class DescriptorSet:
    """A picklable stand-in for (list[cv2.KeyPoint], np.ndarray) - cv2.KeyPoint
    itself isn't picklable, so keypoints are stored as plain tuples."""

    keypoints: list[tuple]  # (x, y, size, angle, response, octave, class_id)
    descriptors: np.ndarray | None


def _decode_image(image_bytes: bytes) -> np.ndarray:
    arr = np.frombuffer(image_bytes, dtype=np.uint8)
    img = cv2.imdecode(arr, cv2.IMREAD_GRAYSCALE)
    if img is None:
        raise ValueError("Could not decode image bytes as an image")
    return img


def compute_descriptors(image_bytes: bytes) -> DescriptorSet:
    """Extract ORB keypoints/descriptors from raw image bytes."""
    img = _decode_image(image_bytes)
    keypoints, descriptors = _orb.detectAndCompute(img, None)
    kp_tuples = [
        (kp.pt[0], kp.pt[1], kp.size, kp.angle, kp.response, kp.octave, kp.class_id)
        for kp in keypoints
    ]
    return DescriptorSet(keypoints=kp_tuples, descriptors=descriptors)


def serialize(descriptor_set: DescriptorSet) -> bytes:
    """Precomputed once at ingest (seed script), never per-request (Tech
    Arch Section 2, step 6)."""
    return pickle.dumps(descriptor_set)


def deserialize(blob: bytes) -> DescriptorSet:
    """Only ever loads bytes our own seed script wrote (see ReferencePhoto
    model docstring) - not visitor-uploaded data, so pickle's untrusted-
    input caveat doesn't apply here."""
    return pickle.loads(blob)


def _to_cv_keypoints(kp_tuples: list[tuple]) -> list[cv2.KeyPoint]:
    return [
        cv2.KeyPoint(x=t[0], y=t[1], size=t[2], angle=t[3], response=t[4], octave=int(t[5]), class_id=int(t[6]))
        for t in kp_tuples
    ]


_bf_matcher = cv2.BFMatcher(cv2.NORM_HAMMING)


def score_against_reference(query: DescriptorSet, reference: DescriptorSet) -> int:
    """Returns the RANSAC inlier count for query vs. one reference photo -
    the confidence score used by the three-tier model (Tech Arch Section 2,
    step 4)."""
    if query.descriptors is None or reference.descriptors is None:
        return 0
    if len(query.descriptors) < 2 or len(reference.descriptors) < 2:
        return 0

    raw_matches = _bf_matcher.knnMatch(query.descriptors, reference.descriptors, k=2)

    good_matches = []
    for pair in raw_matches:
        if len(pair) < 2:
            continue
        m, n = pair
        if m.distance < RATIO_TEST_THRESHOLD * n.distance:
            good_matches.append(m)

    if len(good_matches) < MIN_MATCHES_FOR_RANSAC:
        return 0

    query_kp = _to_cv_keypoints(query.keypoints)
    ref_kp = _to_cv_keypoints(reference.keypoints)

    src_pts = np.float32([query_kp[m.queryIdx].pt for m in good_matches]).reshape(-1, 1, 2)
    dst_pts = np.float32([ref_kp[m.trainIdx].pt for m in good_matches]).reshape(-1, 1, 2)

    _, mask = cv2.findHomography(src_pts, dst_pts, cv2.RANSAC, RANSAC_REPROJ_THRESHOLD)
    if mask is None:
        return 0

    return int(mask.sum())
