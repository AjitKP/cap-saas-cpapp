const cds = require("@sap/cds");
cds.on("served", async () => {
    const { "cds.xt.SaasProvisioningService": provisioning } = cds.services;
    let tenantProvisioning = require("./utils/provisioning");
    provisioning.prepend(tenantProvisioning);
});
module.exports = cds.server;
