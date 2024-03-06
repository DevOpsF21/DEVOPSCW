FROM node:latest

WORKDIR /app/wrd
RUN mkdir -p /app/wrd /app/wrd/dbops
RUN mkdir -p /app/wrd /app/wrd/middleware

# Copy package.json and package-lock.json 
COPY package.json package-lock.json /app/wrd/
COPY wardmodule_new.js /app/wrd/
COPY createwards.js /app/wrd/
COPY .env /app/wrd/
COPY node_modules/ /app/wrd/ 
COPY dbops/dischargeops.js dbops/inpatientops.js dbops/wardops.js  /app/wrd/dbops/
COPY authMiddleware.js /app/wrd/middleware/

# Install dependencies
RUN npm install
# Copy the rest of the application files

# Expose port, wil lthis override the port specificed in the code?
EXPOSE 3000 
# Specify the entry point
CMD ["node", "wardmodule_new.js"] 
