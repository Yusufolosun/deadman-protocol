;; admin-config
;; Protocol-level configuration controlled exclusively by the deployer.
;; All other contracts read from this one. No external writes permitted.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-OWNER (err u100))
(define-constant ERR-INVALID-VALUE (err u101))

;; Minimum vault lock duration in blocks (~1 day at 10 min/block)
(define-data-var min-lock-blocks uint u144)

;; Maximum number of co-signers allowed per vault
(define-data-var max-cosigners uint u5)

;; Maximum number of beneficiaries allowed per vault
(define-data-var max-beneficiaries uint u5)

;; Protocol-wide pause flag. When true, no new vaults can be created.
(define-data-var protocol-paused bool false)

;; --- Read Functions ---

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
