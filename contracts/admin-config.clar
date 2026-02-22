;; admin-config
;; Protocol-level configuration controlled exclusively by the deployer.
;; All other contracts read from this one. No external writes permitted.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-INVALID-VALUE (err u101))

(define-data-var min-lock-blocks uint u144)
(define-data-var max-cosigners uint u5)
(define-data-var max-beneficiaries uint u5)
(define-data-var protocol-paused bool false)

;; --- Bundled Read (reduces inter-contract call count in deadman-vault-core) ---

(define-read-only (get-config)
  {
    min-lock-blocks: (var-get min-lock-blocks),
    max-cosigners: (var-get max-cosigners),
    max-beneficiaries: (var-get max-beneficiaries),
    paused: (var-get protocol-paused)
  })

;; --- Individual Reads (kept for direct queries) ---

(define-read-only (get-min-lock-blocks)
  (var-get min-lock-blocks))

(define-read-only (get-max-cosigners)
  (var-get max-cosigners))

(define-read-only (get-max-beneficiaries)
  (var-get max-beneficiaries))

(define-read-only (is-paused)
  (var-get protocol-paused))

;; --- Admin Write Functions ---

(define-public (set-min-lock-blocks (blocks uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (asserts! (> blocks u0) ERR-INVALID-VALUE)
    (ok (var-set min-lock-blocks blocks))))

(define-public (set-max-cosigners (n uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (asserts! (and (> n u0) (<= n u10)) ERR-INVALID-VALUE)
    (ok (var-set max-cosigners n))))

(define-public (set-max-beneficiaries (n uint))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (asserts! (and (> n u0) (<= n u10)) ERR-INVALID-VALUE)
    (ok (var-set max-beneficiaries n))))

(define-public (set-paused (paused bool))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-OWNER)
    (ok (var-set protocol-paused paused))))
