;; release-handler
;; Executes STX transfer to beneficiary once conditions are verified.
;; Not directly callable by users. Called exclusively by deadman-vault-core.
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
  (or (is-eq tx-sender (var-get authorized-caller))
      (is-eq tx-sender CONTRACT-OWNER)))

;; --- Release Execution ---

;; Transfers STX from the contract's balance to the beneficiary.
;; Only callable by deadman-vault-core after condition verification.
(define-public (execute-release (vault-id uint) (amount uint))
  (let ((beneficiary (unwrap! (contract-call? .delegation-registry get-beneficiary vault-id) ERR-NO-BENEFICIARY)))
    (asserts! (is-authorized) ERR-NOT-AUTHORIZED)
    (asserts! (> amount u0) ERR-ZERO-AMOUNT)
    (match (as-contract (stx-transfer? amount tx-sender beneficiary))
      success (begin
        (print { event: "vault-released", vault-id: vault-id, beneficiary: beneficiary, amount: amount })
        (ok true))
      error ERR-TRANSFER-FAILED)))
