;; condition-engine
;; Evaluates whether a vault's trigger conditions have been satisfied.
;; Supports three condition types: block-height, inactivity, and threshold approval.
;; Returns bool -- does not modify state.

(define-constant ERR-UNKNOWN-TYPE (err u400))

;; Condition type constants
(define-constant CONDITION-BLOCK-HEIGHT u1)
(define-constant CONDITION-INACTIVITY u2)
(define-constant CONDITION-THRESHOLD u3)

;; --- Evaluation Functions ---

;; Evaluates a block-height condition.
;; Returns true if current block height has reached or passed the target.
(define-read-only (check-block-height (target-block uint))
  (>= block-height target-block))

;; Evaluates an inactivity condition.
;; Returns true if the owner has been inactive for at least `inactivity-blocks`.
(define-read-only (check-inactivity (owner principal) (inactivity-blocks uint))
  (contract-call? .activity-tracker is-inactive owner inactivity-blocks))

;; Evaluates a threshold approval condition.
;; Returns true if approval-count >= required-threshold.
(define-read-only (check-threshold (approval-count uint) (required-threshold uint))
  (>= approval-count required-threshold))

;; Master condition evaluator -- called by vault-core before release.
;; condition-type: u1 = block-height, u2 = inactivity, u3 = threshold
(define-read-only (evaluate-condition
    (condition-type uint)
    (owner principal)
    (target-block uint)
    (inactivity-blocks uint)
    (approval-count uint)
    (required-threshold uint))
  (if (is-eq condition-type CONDITION-BLOCK-HEIGHT)
      (ok (check-block-height target-block))
      (if (is-eq condition-type CONDITION-INACTIVITY)
          (ok (check-inactivity owner inactivity-blocks))
          (if (is-eq condition-type CONDITION-THRESHOLD)
              (ok (check-threshold approval-count required-threshold))
              ERR-UNKNOWN-TYPE))))
