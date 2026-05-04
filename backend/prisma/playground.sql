--   This SQL script is intended to be run in a development environment to reset the performance review data.

DELETE FROM review_responses;

DELETE FROM manager_feedback;

UPDATE peer_review_assignments SET performanceReviewId = NULL;

DELETE FROM performance_reviews;

DELETE FROM review_cycles;