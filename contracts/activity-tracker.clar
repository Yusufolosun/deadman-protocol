;; activity-tracker
;; Records the last block height at which a principal was active.
;; Used by condition-engine to evaluate inactivity-based vault triggers.
;; Any principal can ping to update their own record.

;; Map from principal to last-seen block height
(define-map last-active-block principal uint)

;; --- Public Functions ---

;; Called by a principal to record their activity at the current block.
(define-public (ping)
  (begin
    (map-set last-active-block tx-sender block-height)
    (ok block-height)))

;; --- Read Functions ---

;; Returns the last recorded block height for a principal.
;; Returns none if the principal has never pinged.
(define-read-only (get-last-active (who principal))
  (map-get? last-active-block who))

;; Returns true if a principal has been inactive for at least `blocks` blocks.
;; If the principal has never pinged, they are considered inactive from block 0.
(define-read-only (is-inactive (who principal) (blocks uint))
  (let ((last-seen (default-to u0 (map-get? last-active-block who))))
    (>= (- block-height last-seen) blocks)))
