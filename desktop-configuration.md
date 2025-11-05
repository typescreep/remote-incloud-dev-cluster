## On non-remote machine (copy vps-minikube.yaml from vps)

## Merge to use from kubectx

```bash
sudo apt update -y && sudo apt install -y kubectx
KUBECONFIG=~/.kube/config:~/.kube/vps-minikube.yaml kubectl config view --merge --flatten > ~/.kube/merged.yaml
mv ~/.kube/merged.yaml ~/.kube/config
unset KUBECONFIG
```

Maybe you'll want to create `acitvateVps.sh` by adding:

```bash
#!/usr/bin/env bash
```

# Patch kubeconfig

Patch `~/.kube/config` with `insecure-skip-tls-verify: true`

```
  insecure-skip-tls-verify: true
  server: ...
```

# Apply context

```bash
kubectx vps-minikube
```

## Install node/npm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
node -v
npm -v
```

## Install dependencies for `desktop-proxy`

```
cd ./desktop-proxy
npm i
```

## And create proper env

```
cp .env.example .env
```

And edit it

## For WSL edit or create

```
%UserProfile%\.wslconfig
```

with content

```
[wsl2]
networkingMode=mirrored
localhostForwarding=true
firewall=true
autoProxy=true
```

And then restart WSL
