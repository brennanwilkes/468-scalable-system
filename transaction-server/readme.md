To verify the generated logfile, use the following command: 
```
xmllint --schema logFileSchema.xsd --noout yourlogfile.xml
```

To run the code without the docker build process, simple run 
```
npm install
```
to install the dependencies, 

```
npm run build
```

to build the project, and 

```
npm run start
```
to run it. 

Note: You will need a mongo and redis instance to use the code, as well as an env. You can copy the env from the `.env.example` file and run the docker-compose file in this folder to create the mongo and redis instance. 