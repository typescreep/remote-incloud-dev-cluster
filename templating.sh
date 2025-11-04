#!/usr/bin/env bash
echo "---Templating web"
kubectl apply -f ./argo-apps/incloud-web.yaml
kubectl apply -f ./argo-apps/incloud-web-resources.yaml

echo "---Applying roles"
# kubectl apply -f - <<EOF
# ---
# apiVersion: rbac.authorization.k8s.io/v1
# kind: ClusterRole
# metadata:
#   name: admin-clusterrole
# rules:
#   - apiGroups:
#       - "*"
#     resources:
#       - "*"
#     verbs:
#       - "*"
#   - nonResourceURLs:
#       - "*"
#     verbs:
#       - "*"
# EOF
kubectl apply -f - <<EOF
---
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRoleBinding
metadata:
  name: vps-minikube-admin
subjects:
- kind: User
  name: minikube-user
  apiGroup: rbac.authorization.k8s.io
roleRef:
  kind: ClusterRole
  name: front-in-cloud-admin
  apiGroup: rbac.authorization.k8s.io
EOF

echo "---Creating desktop-proxy SA"
kubectl -n incloud-web create sa desktop-proxy
kubectl create clusterrolebinding desktop-proxy-admin \
  --clusterrole=cluster-admin \
  --serviceaccount=incloud-web:desktop-proxy
kubectl -n incloud-web create token desktop-proxy

