#!/usr/bin/env bash
set -euo pipefail

need() {
  command -v "$1" >/dev/null 2>&1 || {
    echo "Missing dependency: $1"
    exit 1
  }
}

need curl
need jq
need python3
need docker

AUTH_BASE="${AUTH_BASE:-http://localhost:4000}"
CLIENT_BASE="${CLIENT_BASE:-http://localhost:8082}"
STACK_CHECK_URL="${STACK_CHECK_URL:-$AUTH_BASE/api/auth/health}"

# Optional: route client traffic through gateway by exporting:
# CLIENT_BASE=http://localhost:3000/client

if [[ "${1:-}" == "--help" ]]; then
  cat <<'EOF'
Usage:
  scripts/seed-load-test-data.sh

Environment variables:
  AUTH_BASE       Default: http://localhost:4000
  CLIENT_BASE     Default: http://localhost:8082
  STACK_CHECK_URL Default: $AUTH_BASE/api/auth/health

Expected outcome (approx):
  - 5 users
  - 12 accounts split 4/3/2/2/1
  - ~75 orders (mostly valid, few rejected)
  - ~30 user events (signup/login/change-password)
  - ~100 transactions (order fills + deposits + withdraws)
EOF
  exit 0
fi

check_stack() {
  if ! curl -fsS "$STACK_CHECK_URL" >/dev/null; then
    echo "Stack does not appear ready."
    echo "Start services first, for example:"
    echo "  docker compose up -d"
    exit 1
  fi
}

rand() {
  python3 - "$1" "$2" <<'PY'
import random,sys
low,high=map(int,sys.argv[1:3])
print(random.randint(low,high))
PY
}

shuffled_user_indexes() {
  python3 - "${#users[@]}" <<'PY'
import random,sys
n=int(sys.argv[1])
idx=list(range(n))
random.shuffle(idx)
print("\n".join(str(i) for i in idx))
PY
}

shuffled_repeated_user_indexes() {
  local repeats="$1"
  python3 - "${#users[@]}" "$repeats" <<'PY'
import random,sys
n=int(sys.argv[1])
r=int(sys.argv[2])
idx=[]
for i in range(n):
    idx.extend([i]*r)
random.shuffle(idx)
print("\n".join(str(i) for i in idx))
PY
}

suffix="$(date +%s)"
users=(u1 u2 u3 u4 u5)
acct_targets=(4 3 2 2 1)

# shellcheck disable=SC2034
# Arrays are intentionally sparse and indexed by user number.
declare -a USERNAME EMAIL PHONE DOB PASS NEWPASS TOKEN USER_ID
# shellcheck disable=SC2034
declare -a ALL_ACCOUNTS
# shellcheck disable=SC2034
declare -A ACCOUNT_OWNER
declare -A INVENTORY
declare -A ACCOUNT_FUNDED

signup_user() {
  local i="$1"
  USERNAME[$i]="${users[$i]}_${suffix}"
  EMAIL[$i]="${USERNAME[$i]}@example.com"
  PHONE[$i]="41555501$((10+i))"
  DOB[$i]="199$((i+1))-0$(((i%9)+1))-1$((i%9))"
  PASS[$i]="SeedPassA$((i+1))9"
  NEWPASS[$i]="SeedNewA$((i+1))9"

  curl -fsS -X POST "$AUTH_BASE/api/auth/signup" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg u "${USERNAME[$i]}" \
      --arg e "${EMAIL[$i]}" \
      --arg p "${PASS[$i]}" \
      --arg ph "${PHONE[$i]}" \
      --arg dob "${DOB[$i]}" \
      '{username:$u,email:$e,password:$p,phoneNumber:$ph,dateOfBirth:$dob}')" \
    >/dev/null
}

login_user() {
  local i="$1"
  local pwd="$2"
  local tok

  tok="$(curl -fsS -X POST "$AUTH_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg u "${USERNAME[$i]}" --arg p "$pwd" '{username:$u,password:$p}')" | jq -r '.token')"

  if [[ -z "$tok" || "$tok" == "null" ]]; then
    echo "Login failed for ${USERNAME[$i]}"
    exit 1
  fi

  TOKEN[$i]="$tok"
  USER_ID[$i]="$(curl -fsS "$AUTH_BASE/api/auth/whoami" \
    -H "Authorization: Bearer ${TOKEN[$i]}" | jq -r '.userId')"
}

create_account() {
  local i="$1"
  local nick="$2"
  local acc

  acc="$(curl -fsS -X POST "$CLIENT_BASE/api/users/${USER_ID[$i]}/accounts" \
    -H "Authorization: Bearer ${TOKEN[$i]}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg n "$nick" '{nickname:$n}')" | jq -r '.accountId')"

  if [[ -z "$acc" || "$acc" == "null" ]]; then
    echo "Account create failed for user ${USERNAME[$i]}"
    exit 1
  fi

  ALL_ACCOUNTS+=("$acc")
  ACCOUNT_OWNER["$acc"]="$i"
}

post_amount() {
  local endpoint="$1"
  local amount="$2"
  local owner="$3"

  curl -fsS -X POST "$CLIENT_BASE$endpoint" \
    -H "Authorization: Bearer ${TOKEN[$owner]}" \
    -H "Content-Type: application/json" \
    -d "$amount" \
    >/dev/null
}

get_account_balance() {
  local acc="$1"
  local owner="${ACCOUNT_OWNER[$acc]}"
  local uid="${USER_ID[$owner]}"

  curl -fsS "$CLIENT_BASE/api/users/$uid/accounts/$acc" \
    -H "Authorization: Bearer ${TOKEN[$owner]}" | jq -r '.cashBalance // 0'
}

safe_withdraw() {
  local acc="$1"
  local owner="$2"
  local desired="$3"
  local balance
  local topup

  balance="$(get_account_balance "$acc")"

  topup="$(python3 - "$balance" "$desired" <<'PY'
import sys
b=float(sys.argv[1])
d=float(sys.argv[2])
if d > b:
    print(int(d - b) + 200)
else:
    print(0)
PY
)"

  if (( topup > 0 )); then
    post_amount "/api/accounts/$acc/deposit" "$topup" "$owner"
  fi

  post_amount "/api/accounts/$acc/withdraw" "$desired" "$owner"
}

place_order() {
  local acc="$1"
  local instr="$2"
  local qty="$3"
  local side="$4"
  local owner="${ACCOUNT_OWNER[$acc]}"

  curl -fsS -X POST "$CLIENT_BASE/api/accounts/$acc/orders" \
    -H "Authorization: Bearer ${TOKEN[$owner]}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --argjson instrumentId "$instr" \
      --argjson quantity "$qty" \
      --arg side "$side" \
      '{instrumentId:$instrumentId,quantity:$quantity,stockPrice:100.0,orderType:$side}')" \
    >/dev/null
}

pick_inventory_key() {
  local keys=()
  local k

  for k in "${!INVENTORY[@]}"; do
    if (( INVENTORY[$k] > 0 )); then
      keys+=("$k")
    fi
  done

  if (( ${#keys[@]} == 0 )); then
    return 1
  fi

  local idx
  idx="$(rand 0 $((${#keys[@]} - 1)))"
  printf '%s\n' "${keys[$idx]}"
}

check_stack

echo "[1/8] Signing up users"
for i in $(shuffled_user_indexes); do
  signup_user "$i"
done

echo "[2/8] Initial login + whoami"
for i in $(shuffled_user_indexes); do
  login_user "$i" "${PASS[$i]}"
done

echo "[3/8] Creating 12 accounts (4/3/2/2/1)"
for i in $(shuffled_user_indexes); do
  target="${acct_targets[$i]}"
  for n in $(seq 1 "$target"); do
    create_account "$i" "acct_${i}_${n}"
  done
done

echo "[4/8] Running mixed cash + order activity"
total_orders=75
rejected_target=8
sell_target=18
rejected_count=0
sell_count=0

for _ in $(seq 1 "$total_orders"); do
  # Random cash operation before this order to avoid grouped deposit/withdraw runs.
  if (( $(rand 1 100) <= 38 )); then
    cash_idx="$(rand 0 $((${#ALL_ACCOUNTS[@]} - 1)))"
    cash_acc="${ALL_ACCOUNTS[$cash_idx]}"
    cash_owner="${ACCOUNT_OWNER[$cash_acc]}"

    if (( $(rand 1 100) <= 58 )); then
      cash_amt="$(rand 500 4000)"
      post_amount "/api/accounts/$cash_acc/deposit" "$cash_amt" "$cash_owner"
    else
      cash_amt="$(rand 100 1500)"
      safe_withdraw "$cash_acc" "$cash_owner" "$cash_amt"
    fi
  fi

  roll="$(rand 1 100)"

  # Keep a few guaranteed rejected orders for realistic failure data.
  if (( rejected_count < rejected_target && roll <= 12 )); then
    idx="$(rand 0 $((${#ALL_ACCOUNTS[@]} - 1)))"
    acc="${ALL_ACCOUNTS[$idx]}"
    instr="$(rand 1 20)"
    qty="$(rand 100000 200000)"
    place_order "$acc" "$instr" "$qty" "BUY"
    rejected_count=$((rejected_count + 1))
    continue
  fi

  # Mix in SELL orders only when we have prior BUY volume for that account+instrument.
  if (( sell_count < sell_target )) && inv_key="$(pick_inventory_key 2>/dev/null)"; then
    if (( roll > 30 && roll <= 65 )); then
      acc="${inv_key%%:*}"
      instr="${inv_key##*:}"
      max_qty="${INVENTORY[$inv_key]}"
      if (( max_qty > 4 )); then
        max_qty=4
      fi
      if (( max_qty < 1 )); then
        max_qty=1
      fi
      qty="$(rand 1 "$max_qty")"

      place_order "$acc" "$instr" "$qty" "SELL"
      INVENTORY[$inv_key]=$((INVENTORY[$inv_key] - qty))
      sell_count=$((sell_count + 1))
      continue
    fi
  fi

  idx="$(rand 0 $((${#ALL_ACCOUNTS[@]} - 1)))"
  acc="${ALL_ACCOUNTS[$idx]}"
  instr="$(rand 1 20)"

  # Seed account cash on first normal use so deposits are spread through the run.
  if [[ -z "${ACCOUNT_FUNDED[$acc]:-}" ]]; then
    owner="${ACCOUNT_OWNER[$acc]}"
    seed_amt="$(rand 20000 60000)"
    post_amount "/api/accounts/$acc/deposit" "$seed_amt" "$owner"
    ACCOUNT_FUNDED[$acc]=1
  fi

  qty="$(rand 1 4)"
  place_order "$acc" "$instr" "$qty" "BUY"

  inv_key="$acc:$instr"
  current_qty="${INVENTORY[$inv_key]:-0}"
  INVENTORY[$inv_key]=$((current_qty + qty))
done

echo "[5/8] Waiting for async order processing"
for _ in $(seq 1 50); do
  pending=0
  for acc in "${ALL_ACCOUNTS[@]}"; do
    owner="${ACCOUNT_OWNER[$acc]}"
    c="$(curl -fsS "$CLIENT_BASE/api/accounts/$acc/orders" \
      -H "Authorization: Bearer ${TOKEN[$owner]}" | \
      jq '[.[] | select(.status=="PLACED" or .status=="PENDING" or .status=="CREATED")] | length')"
    pending=$((pending + c))
  done
  if [[ "$pending" -eq 0 ]]; then
    break
  fi
  sleep 2
done

echo "[6/8] Generating additional user audit events"
# +5 change password events
for i in $(shuffled_user_indexes); do
  curl -fsS -X PATCH "$AUTH_BASE/api/auth/change-password" \
    -H "Authorization: Bearer ${TOKEN[$i]}" \
    -H "Content-Type: application/json" \
    -d "$(jq -n \
      --arg c "${PASS[$i]}" \
      --arg n "${NEWPASS[$i]}" \
      '{currentPassword:$c,newPassword:$n,confirmPassword:$n}')" \
    >/dev/null
done

# +5 failed logins (old password)
for i in $(shuffled_user_indexes); do
  curl -sS -o /dev/null -w "%{http_code}" -X POST "$AUTH_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "$(jq -n --arg u "${USERNAME[$i]}" --arg p "${PASS[$i]}" '{username:$u,password:$p}')" \
    >/dev/null || true
done

# +10 successful logins (new password), also refresh tokens used for later requests
for i in $(shuffled_repeated_user_indexes 2); do
  login_user "$i" "${NEWPASS[$i]}"
done

echo "[7/8] Verifying counts in Postgres"
docker exec -i tidbits-postgres sh -lc '
  psql -U "$POSTGRES_USER" -d "$POSTGRES_DB" -Atc "
  select '\''users'\'', count(*) from users
  union all select '\''accounts'\'', count(*) from accounts
  union all select '\''orders'\'', count(*) from orders
  union all select '\''orders_rejected'\'', count(*) from orders where status='\''rejected'\''
  union all select '\''account_transactions'\'', count(*) from account_transactions
  union all select '\''user_logs'\'', count(*) from user_logs
  union all select '\''transaction_logs'\'', count(*) from transaction_logs;
  "
'

echo
echo "Done. Created high-volume seed data with per-user token switching."