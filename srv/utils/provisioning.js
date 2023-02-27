const cds = require("@sap/cds");
const xsenv = require("@sap/xsenv");
xsenv.loadEnv();

module.exports = (service) => {
    service.on("UPDATE", "tenant", async (req, next) => {
        console.log("Subscription data:", JSON.stringify(req.data));
        let tenantURL = process.env.APP_PROTOCOL + "://" + req.data.subscribedSubdomain + "-" + process.env.APP_URI;
        await next();
        return tenantURL;
    });

    service.on("DELETE", "tenant", async (req, next) => {
        console.log("Unsubscribe Data: ", JSON.stringify(req.data));
        await next();
        return req.data.subscribedTenantId;
    });

    service.on("upgradeTenant", async (req, next) => {
        await next();
        console.log("UpgradeTenant: ", JSON.stringify(req.data));
        console.log("UpgradeTenant: ", JSON.stringify(cds.context.req.body));
    });

    service.on("dependencies", async (req, next) => {
        let dependencies = await next();
        const services = xsenv.getServices({ destination: { tag: "destination" } });
        dependencies.push({ xsappname: services.destination.xsappname });
        console.log("SaaS Dependencies:", JSON.stringify(dependencies));
        return dependencies;
    });
};
