;; deadman-vault-extensions
;; Optional metadata for vaults (name, category).
;; Vault owners call this contract directly to attach metadata.
;; Reads deadman-vault-core-v2 to verify ownership.

(define-constant ERR-VAULT-NOT-FOUND (err u1000))
(define-constant ERR-NOT-VAULT-OWNER (err u1001))

(define-map vault-metadata uint {
  name: (string-ascii 64),
  category: uint
})

;; Set metadata for a vault (owner only)
(define-public (set-vault-metadata (vault-id uint) (name (string-ascii 64)) (category uint))
  (let ((vault (unwrap! (contract-call? .deadman-vault-core-v2 get-vault vault-id) ERR-VAULT-NOT-FOUND)))
    (asserts! (is-eq tx-sender (get owner vault)) ERR-NOT-VAULT-OWNER)
    (print { event: "metadata-set", vault-id: vault-id, name: name, category: category })
    (ok (map-set vault-metadata vault-id { name: name, category: category }))))

;; Get full metadata for a vault
(define-read-only (get-vault-metadata (vault-id uint))
  (map-get? vault-metadata vault-id))

;; Get vault name only
(define-read-only (get-vault-name (vault-id uint))
  (get name (map-get? vault-metadata vault-id)))

;; Get vault category only
(define-read-only (get-vault-category (vault-id uint))
  (get category (map-get? vault-metadata vault-id)))
