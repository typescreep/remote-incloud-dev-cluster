#!/usr/bin/env bash
echo "prorobotech/openapi-ui"
curl -s "https://hub.docker.com/v2/repositories/prorobotech/openapi-ui/tags/?page_size=3" \
| jq -r '.results[] | "\(.name) \t \(.last_updated)"' \
| while IFS=$'\t' read -r tag tstamp; do
  # convert timestamps to seconds
  t_epoch=$(date -d "$tstamp" +%s)
  now=$(date +%s)
  diff=$((now - t_epoch))

  # convert to readable "time ago"
  if (( diff < 60 )); then ago="${diff}s ago"
  elif (( diff < 3600 )); then ago="$((diff/60))m ago"
  elif (( diff < 86400 )); then ago="$((diff/3600))h ago"
  elif (( diff < 604800 )); then ago="$((diff/86400))d ago"
  elif (( diff < 2592000 )); then ago="$((diff/604800))w ago"
  else ago="$((diff/2592000))mo ago"
  fi

  printf "%-20s | %-30s | %s\n" "$tag" "$tstamp" "$ago"
done

echo "---"

echo "prorobotech/openapi-ui-k8s-bff"
curl -s "https://hub.docker.com/v2/repositories/prorobotech/openapi-ui-k8s-bff/tags/?page_size=3" \
| jq -r '.results[] | "\(.name) \t \(.last_updated)"' \
| while IFS=$'\t' read -r tag tstamp; do
  # convert timestamps to seconds
  t_epoch=$(date -d "$tstamp" +%s)
  now=$(date +%s)
  diff=$((now - t_epoch))

  # convert to readable "time ago"
  if (( diff < 60 )); then ago="${diff}s ago"
  elif (( diff < 3600 )); then ago="$((diff/60))m ago"
  elif (( diff < 86400 )); then ago="$((diff/3600))h ago"
  elif (( diff < 604800 )); then ago="$((diff/86400))d ago"
  elif (( diff < 2592000 )); then ago="$((diff/604800))w ago"
  else ago="$((diff/2592000))mo ago"
  fi

  printf "%-20s | %-30s | %s\n" "$tag" "$tstamp" "$ago"
done
