FROM node:21
# Install necessary build dependencies for bcrypt
RUN apt-get update && apt-get install -y build-essential python3
WORKDIR /app
# Copy package.json and package-lock.json 
COPY package.json package-lock.json ./
# Install dependencies
RUN npm install
# Copy the rest of the application files
COPY . .
# Rebuild bcrypt for ARM64 architecture
RUN npm rebuild bcrypt --build-from-source
# Expose port
EXPOSE 3000
# Specify the entry point
CMD ["node", "auth.js"] 

