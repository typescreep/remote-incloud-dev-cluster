#!/usr/bin/env bash
echo "--- start minikube"
PROFILE="vps-minikube"
minikube delete -p "$PROFILE" 2>/dev/null || true
minikube start -p "$PROFILE" \
  --driver=docker \
  --cpus=2 \
  --memory=6g
  # --memory=6g \
  # --listen-address=0.0.0.0
minikube profile "$PROFILE"
minikube update-context -p "$PROFILE"

kubectl cluster-info
kubectl get nodes

echo "--- installing argo"
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update
helm upgrade --install argocd argo/argo-cd \
  -n argocd --create-namespace

echo "--- getting kubeconfig"
kubectl config view --context="$PROFILE" --raw --flatten --minify \
| sed "s#^\(\s*server:\s*\).*#\1https://${PUBLIC_IP}:6443#" \
> ~/${PROFILE}.yaml
chmod 600 ~/${PROFILE}.yaml

echo "ArgoCD Password: "
echo "kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d"
