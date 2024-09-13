import express from "express";
import http from "node:http";
import { uvPath } from "@titaniumnetwork-dev/ultraviolet";
import { epoxyPath } from "@mercuryworkshop/epoxy-transport";
import { baremuxPath } from "@mercuryworkshop/bare-mux/node";
import wisp from "wisp-server-node";
import config from "../config.json" assert { type: "json" };

const port = config.port;

const app = express();
const server = http.createServer(app);


app.use((req, res, next) => {
    req.chromebook = true
    if (config.allowOnlyChromebooks && !req.headers["user-agent"].includes("CrOS")) {
        req.chromebook = false;
    }
    next();
});

const routes = {
    "": "home.html",
    "h": "home.html",
};
const nonEnforcedRoutes = ["uv", "epoxy", "baremux"];
for (const route of Object.keys(routes)) {
    app.get(`/${route}`, (req, res) => {
        if (!nonEnforcedRoutes.includes(route) && !req.chromebook) {
            res.sendStatus(404);
            return;
        }
        res.sendFile(`client/${routes[route]}`, (err) => {
            res.send("An error has occured.");
        });
    });
}

app.use("/uv/", express.static(uvPath));
app.use("/epoxy/", express.static(epoxyPath));
app.use("/baremux/", express.static(baremuxPath));

server.on("upgrade", (req, socket, head) => {
    if (req.url.endsWith("/wisp/")) {
        wisp.routeRequest(req, socket, head);
    } else {
        socket.end();
    }
});

server.listen(port);

