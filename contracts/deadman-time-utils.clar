;; deadman-time-utils
;; Block-time estimation utilities for the Deadman Protocol.
;; Stacks averages ~10 minutes per block.
;; All functions are read-only -- no state is stored.

(define-constant MINUTES-PER-BLOCK u10)
(define-constant BLOCKS-PER-HOUR u6)
(define-constant BLOCKS-PER-DAY u144)
(define-constant BLOCKS-PER-WEEK u1008)

;; Returns estimated blocks remaining until a target block.
;; Returns u0 if target has already passed.
(define-read-only (blocks-remaining (target-block uint))
  (if (>= block-height target-block)
      u0
      (- target-block block-height)))

;; Returns true if the target block has been reached or passed.
(define-read-only (is-past-target (target-block uint))
  (>= block-height target-block))

;; Converts block count to approximate minutes.
(define-read-only (blocks-to-minutes (blocks uint))
  (* blocks MINUTES-PER-BLOCK))

;; Converts block count to approximate hours.
(define-read-only (blocks-to-hours (blocks uint))
  (/ (* blocks MINUTES-PER-BLOCK) u60))

;; Converts block count to approximate days.
(define-read-only (blocks-to-days (blocks uint))
  (/ blocks BLOCKS-PER-DAY))

;; Converts days to approximate block count.
(define-read-only (days-to-blocks (days uint))
  (* days BLOCKS-PER-DAY))

;; Converts hours to approximate block count.
(define-read-only (hours-to-blocks (hours uint))
  (* hours BLOCKS-PER-HOUR))

;; Returns the current block height.
(define-read-only (get-current-block)
  block-height)
