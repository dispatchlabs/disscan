![alt dispatch](https://dispatchlabs.io/wp-content/themes/ccprototypev5/images/dispatchlabs-logo.png)

# Scandis
Scandis allows you to search for individual delegate nodes and see their information and transaction history.

## Prerequisites
Scandis requires the following components to be installed:
- Node `brew install node` 
- Angular CLI (optional)  `npm install -g @angular/cli`

*More information on installing [node](https://nodejs.org/en/download/package-manager/)* ![](https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_launch_black_18px.svg)

*More information on installing [angular-cli](https://github.com/angular/angular-cli)* ![](https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_launch_black_18px.svg)

# ![](https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_directions_run_black_24px.svg) Setup and Run
- `git clone https://github.com/dispatchlabs/web-wallet.git`<br>
- `cd web-wallet`<br>
- `npm i`<br>
- `ng serve -e=dev` or `ng serve -e=dispatch`<br>
- Open in browser `http://localhost:4200/`

## Node IP 
To change the delegate node IPs to connect to modify delegateIps in the appropriate ./src/environments/ file. 

~~~javascript
export const environment = {
    name: 'dev',
    production: false,
    delegateIps: ['35.199.173.199', '35.227.16.102', '35.230.76.164', '35.230.101.49'],
    
~~~



## Build
Run `ng build -e=dev` or `ng build -e=dispatch`to build the project. The build artifacts will be stored in the `dist/` directory. Use the `-prod` flag for a production build.

## Further help
To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI README](https://github.com/angular/angular-cli/blob/master/README.md).
