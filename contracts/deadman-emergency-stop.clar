;; deadman-emergency-stop
;; Guardian-based emergency controls for the Deadman Protocol.
;; Multiple guardians can vote to trigger an emergency stop.
;; Uses vote rounds so votes reset cleanly after resolution.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u1300))
(define-constant ERR-NOT-GUARDIAN (err u1301))
(define-constant ERR-ALREADY-VOTED (err u1302))
(define-constant ERR-NOT-IN-EMERGENCY (err u1303))
(define-constant ERR-ALREADY-IN-EMERGENCY (err u1304))
(define-constant ERR-COOLDOWN-ACTIVE (err u1305))

(define-data-var emergency-active bool false)
(define-data-var vote-threshold uint u2)
(define-data-var current-votes uint u0)
(define-data-var vote-round uint u0)
(define-data-var last-emergency-block uint u0)
(define-data-var cooldown-blocks uint u144) ;; ~1 day

(define-map guardians principal bool)
(define-map has-voted { voter: principal, round: uint } bool)

;; --- Admin Functions ---

(define-public (add-guardian (guardian principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (print { event: "guardian-added", guardian: guardian })
    (ok (map-set guardians guardian true))))

(define-public (remove-guardian (guardian principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (print { event: "guardian-removed", guardian: guardian })
    (ok (map-delete guardians guardian))))

(define-public (set-vote-threshold (threshold uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set vote-threshold threshold))))

(define-public (set-cooldown (blocks uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set cooldown-blocks blocks))))

;; --- Guardian Functions ---

;; Guardian votes for emergency stop
(define-public (vote-emergency-stop)
  (let ((round (var-get vote-round)))
    (asserts! (is-guardian tx-sender) ERR-NOT-GUARDIAN)
    (asserts! (not (var-get emergency-active)) ERR-ALREADY-IN-EMERGENCY)
    (asserts! (not (default-to false (map-get? has-voted { voter: tx-sender, round: round })))
      ERR-ALREADY-VOTED)
    (map-set has-voted { voter: tx-sender, round: round } true)
    (var-set current-votes (+ (var-get current-votes) u1))
    (if (>= (var-get current-votes) (var-get vote-threshold))
      (begin
        (var-set emergency-active true)
        (var-set last-emergency-block block-height)
        (print { event: "emergency-activated", block: block-height, round: round })
        (ok true))
      (begin
        (print { event: "emergency-vote", voter: tx-sender, votes: (var-get current-votes), round: round })
        (ok false)))))

;; --- Owner Functions ---

;; Resolve emergency (owner only, after cooldown period)
(define-public (resolve-emergency)
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (asserts! (var-get emergency-active) ERR-NOT-IN-EMERGENCY)
    (asserts! (>= block-height (+ (var-get last-emergency-block) (var-get cooldown-blocks)))
      ERR-COOLDOWN-ACTIVE)
    (var-set emergency-active false)
    (var-set current-votes u0)
    ;; Advance vote round so previous votes become stale
    (var-set vote-round (+ (var-get vote-round) u1))
    (print { event: "emergency-resolved", block: block-height })
    (ok true)))

;; --- Read Functions ---

(define-read-only (is-emergency)
  (var-get emergency-active))

(define-read-only (is-guardian (who principal))
  (default-to false (map-get? guardians who)))

(define-read-only (get-vote-count)
  (var-get current-votes))

(define-read-only (get-vote-threshold)
  (var-get vote-threshold))

(define-read-only (get-emergency-block)
  (var-get last-emergency-block))

(define-read-only (get-vote-round)
  (var-get vote-round))
