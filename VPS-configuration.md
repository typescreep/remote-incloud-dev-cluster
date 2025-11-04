## Installing docker

```bash
sudo apt update -y
sudo apt install -y ca-certificates curl gnupg
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/$(. /etc/os-release; echo "$ID")/gpg \
  | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
  https://download.docker.com/linux/$(. /etc/os-release; echo "$ID") \
  $(. /etc/os-release; echo "$VERSION_CODENAME") stable" \
  | sudo tee /etc/apt/sources.list.d/docker.list >/dev/null
sudo apt update -y
sudo apt install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo useradd -m -s /bin/bash dev 2>/dev/null || true
sudo usermod -aG docker dev
sudo usermod -aG docker $USER && newgrp docker
sudo systemctl restart docker
```

## Installing kubectl/kubeadm

```bash
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo "deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.34/deb/ /" | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt update
sudo apt install -y kubectl
sudo apt install -y kubeadm
```

## Installign helm

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
```

## Installing helmfile

If you have installed latest, but we want another

```bash
sudo apt remove -y helmfile 2>/dev/null || true
sudo rm -f $(command -v helmfile) || true
which helmfile || echo "✅ helmfile removed"
```

Specific installation

```bash
cd /tmp
curl -fsSL -o helmfile.tar.gz \
 https://github.com/helmfile/helmfile/releases/download/v0.169.1/helmfile_0.169.1_linux_amd64.tar.gz
tar -xzf helmfile.tar.gz
sudo mv helmfile /usr/local/bin/helmfile
sudo chmod +x /usr/local/bin/helmfile
rm -f helmfile.tar.gz
helmfile version
```

## Installing minikube

```bash
curl -LO https://github.com/kubernetes/minikube/releases/latest/download/minikube-linux-amd64
sudo install minikube-linux-amd64 /usr/local/bin/minikube && rm minikube-linux-amd64
```

## Setting public IP as env

```bash
echo 'export PUBLIC_IP=123.123.123.123' >> ~/.bashrc # your vps public ip here
source ~/.bashrc
```

## Now run [./cluster.sh](./cluster.sh)

## 👽 For kubeconfig usage

```bash
sudo apt-get install -y nginx
sudo apt-get install -y libnginx-mod-stream
sudo mkdir -p /etc/nginx/streams-enabled
sudo tee -a /etc/nginx/nginx.conf >/dev/null <<'CONF'

# TCP streams (Kubernetes API, etc.)

stream {
include /etc/nginx/streams-enabled/\*.conf;
}
CONF

sudo tee /etc/nginx/streams-enabled/k8s-apiserver.conf >/dev/null <<'CONF'

# Forward public :6443 -> Minikube apiserver :8443

upstream apiserver {
server 192.168.58.2:8443; # <- internal host:port from `kubectl config view --minify`
}

server {
listen 0.0.0.0:6443;
proxy_connect_timeout 10s;
proxy_timeout 3600s;
proxy_pass apiserver;
}
CONF

sudo nginx -t
sudo systemctl reload nginx
sudo ufw allow "Nginx Full"
sudo ufw allow "Nginx HTTP"
sudo ufw allow "Nginx HTTPS"
ss -ltnp | grep :6443
```

## Patching kubeconfig:

```bash
curl -kI https://127.0.0.1:6443/version
curl -kI https://123.123.123.123:6443/version # your vps public ip here
KUBECONFIG=~/vps-minikube.yaml kubectl get pods -A
KUBECONFIG=~/vps-minikube.yaml kubectl get --raw=/version
```

You will get x509 error, but with `server-name`s to find

Sooner I found:

```
kubectl config view --minify
```

to do this ^

```bash
kubectl --kubeconfig ~/vps-minikube.yaml config set-cluster vps-minikube --tls-server-name=192.168.58.2 # ip from x509 error
KUBECONFIG=~/vps-minikube.yaml kubectl get pods -A
KUBECONFIG=~/vps-minikube.yaml kubectl get --raw=/version
```
