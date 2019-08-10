---
layout: post
title: "Detecting New Docker Tags on Kubernetes"
---

I'm mid-coffee, so I hope this is coherent.

Kubernetes clusters often run container images pulled from The Great Docker Hub registry. It's certainly a very convenient place to find software, pre-packaged and ready to deploy. Most images are also "tagged" with specific versions, and it's generally a good idea to deploy an image at a specific tag so that your software image doesn't change underneath you when K8s decides to reschedule a pod somewhere else. (Yes I know that the actual image can change underneath the same tag, and to get true immutability you should use the hash, but sometimes you want seamless security updates etc. It's a tradeoff)

One of the challenges I had with this model is knowing when a new release comes out. Some bits of software tell you (hello [PiHole](https://pi-hole.net)) when you log in that there's a new version available), but given that everything is all APIs there should be a way to automate it.

Therefore, I wrote a script. It's simple and bug-ridden:

```
#!/bin/bash
for p in $(kubectl get deployments -o jsonpath='{range .items[*]}{range .spec.template.spec.containers[*]}{.image}{"\n"}{end}'| grep -v  "latest\|stable"); do 
    IFS=:
    read -r -a array <<< "$p"
    latest=$(curl -s https://hub.docker.com/v2/repositories/"${array[0]}"/tags/ | jq -r '[.results[]|select(.name | test("^v?\\d+\\.\\d+\\.\\d(-\\d+)?$"))][0].name')
    if [[ "${array[1]}" != "$latest" ]]; then
        echo "${array[0]}" Current: "${array[1]}" Latest: "$latest"
    fi
done
```

This depends on `kubectl` and `curl`. Hopefully it's pretty obvious.

Next step (obviously) is to turn this into a k8s cron and call a webhook if there are updates available.