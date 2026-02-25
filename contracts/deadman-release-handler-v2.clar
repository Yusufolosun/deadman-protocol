;; deadman-release-handler-v2
;; Standalone STX release utility.
;; NOTE: As of V2, deadman-vault-core-v2 transfers STX directly to beneficiaries.
;; This contract is retained for standalone use and potential future extensions
;; (e.g. partial releases, multi-token support).
;; Emits a structured release event on success.

(define-constant CONTRACT-OWNER tx-sender)
(define-constant ERR-NOT-AUTHORIZED (err u500))
(define-constant ERR-NO-BENEFICIARY (err u501))
(define-constant ERR-ZERO-AMOUNT (err u502))
(define-constant ERR-TRANSFER-FAILED (err u503))

(define-data-var authorized-caller principal CONTRACT-OWNER)

;; --- Authorization ---

(define-public (set-authorized-caller (caller principal))
  (begin
    (asserts! (is-eq tx-sender CONTRACT-OWNER) ERR-NOT-AUTHORIZED)
    (ok (var-set authorized-caller caller))))

(define-private (is-authorized)
  (or (is-eq contract-caller (var-get authorized-caller))
      (is-eq contract-caller CONTRACT-OWNER)))

;; --- Release Execution ---

;; Transfers STX from the contract's balance to the beneficiary.
(define-public (execute-release (vault-id uint) (amount uint))
  (let ((beneficiary (unwrap! (contract-call? .deadman-delegation-registry-v2 get-beneficiary vault-id) ERR-NO-BENEFICIARY)))
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (match (as-contract (stx-transfer? amount tx-sender beneficiary))
      success (begin
        (print { event: "vault-released", vault-id: vault-id, beneficiary: beneficiary, amount: amount })
        (ok true))
      error ERR-TRANSFER-FAILED)))
