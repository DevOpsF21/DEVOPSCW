FROM node:latest

WORKDIR /app/reg
RUN mkdir -p /app/reg /app/reg/dbops
RUN mkdir -p /app/reg /app/reg/middleware

# Copy package.json and package-lock.json 
COPY package.json package-lock.json /app/reg/
COPY regmodule.js /app/reg/
COPY .env /app/reg/
COPY node_modules/ /app/reg/ 
COPY dbops/regops.js dbops/logops.js  /app/reg/dbops/
COPY authMiddleware.js /app/reg/middleware/

# Install dependencies
RUN npm install
# Copy the rest of the application files

# Expose port, wil lthis override the port specificed in the code?
EXPOSE 3000 
# Specify the entry point
CMD ["node", "regmodule.js"] 
