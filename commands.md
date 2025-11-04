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

## Run web + web proxy simultaneously

```
cd ./desktop-proxy; npm run all
```

## Run web + web proxy simultaneously via shell tricks

From `./desktop-proxy`:

```
pkill -f "kubectl port-forward .*9081:8081"; kubectl port-forward svc/incloud-web-incloud-web-chart 9081:8081 -n incloud-web &
npm start
```

To kill forward afterwards:

```
pkill -f "kubectl port-forward .*9081:8081"
```
