## Run ArgoCD

```
kubectl port-forward svc/argocd-server -n argocd 8080:443
```

## Run web

```
kubectl port-forward svc/incloud-web-incloud-web-chart 9081:8081 -n incloud-web
```

## Run web proxy

```
cd ./desktop-proxy; npm start
```
