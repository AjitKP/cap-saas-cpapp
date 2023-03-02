# Welcome

Welcome to this tutorial for Saas Application Development on SAP Business Technology Platform (SAP BTP). We provide information and examples on how to develop and deploy an saas application based on [SAP Cloud Application Programming Model (CAP)](https://cap.cloud.sap/) on SAP BTP using different tools and services step by step.

_**main**_ brnach conatins the code base for single tenant application  
_**saasapp**_ brnach conatins the code base for multi tenant application   

## Steps followed to Make this Single Application to a Multi-Tenant Application
1. use terminal command: 
    ```
    cds add multitenancy --for production
    ```
    It changes following things:
    - [package.json] adds @sap/cds-mtxs package as dependency
    - [package.json] changes db.kind to hana-mt from hana-cloud
    - [package.json] enables multitenancy by setting "multitenancy": true
    - [mta.yaml] removes db deployer module (type=hdb)
    - [mta.yaml] removes hdi container resource (type=com.sap.xs.hdi-container)
    - [mta.yaml] Adds Saas Registry Service (saas-registry)
    - [mta.yaml] Service Manager Service (service-manager) as resource
    - [mta.yaml] Adds saas-registry and service-manager as dependency for CAP server module
    - [xs-security.json] Adds/Provides mtcallback and cds.Subscriber scope   
    <br/>
    mtcallback : scope by which the subscription endpoints are authorized.  
    mtdeployment : scope by which the deployment endpoints are authorized.  
    cds.Subscriber : ??
2. Update Saas Registry Service Configurations like Description, App Name, Category etc
3. Add tenant host pattern as property for app router module in mta.yaml
    ```
    properties:
      TENANT_HOST_PATTERN: '^(.*)-${default-uri}'
    ```
4. Update approuter provides section with its url
    ```
    provides:
      - name: app-api
        properties:
          app-protocol: ${protocol}
          app-uri: ${default-uri}
    ```
5. Update requires section of server module with approuter api 
    ```
    - name: app-api
      properties:
        APP_PROTOCOL: ~{app-protocol}
        APP_URI: ~{app-uri}
    ```
6. install @sap/xsenv package
    ```
    npm install @sap/xsenv --save
    ```
7. Change tenant mode to Shared in mta.yaml
8. Add server.js: Adds provisioning logic to cds server
    ```
    const cds = require("@sap/cds");
    cds.on("served", async () => {
        const { "cds.xt.SaasProvisioningService": provisioning } = cds.services;
        let tenantProvisioning = require("./utils/provisioning");
        provisioning.prepend(tenantProvisioning);
    });
    module.exports = cds.server;
    ```
9. Add provisioning.js in utils folder: It registers handlers for Saas Provisioning Events like Subscribe, Unsubscribe, Upgrade
    ```
    const cds = require("@sap/cds");
    const xsenv = require("@sap/xsenv");
    xsenv.loadEnv();

    module.exports = (service) => {
        service.on("UPDATE", "tenant", async (req, next) => {
            let tenantURL = process.env.APP_PROTOCOL + "://" + req.data.subscribedSubdomain + "-" + process.env.APP_URI;
            await next();
            return tenantURL;
        });

        service.on("DELETE", "tenant", async (req, next) => {
            await next();
            return req.data.subscribedTenantId;
        });

        service.on("upgradeTenant", async (req, next) => {
            await next();
        });

        service.on("dependencies", async (req, next) => {
            let dependencies = await next();
            const services = xsenv.getServices({ destination: { tag: "destination" } });
            dependencies.push({ xsappname: services.destination.xsappname });
            return dependencies;
        });
    };
    ```
10. Currently logic to create CF route is not added. Hence, once subscribed, route needs to be added manually in provider account.
