FROM node:latest

WORKDIR /app/auth
RUN mkdir -p /app/auth /app/auth/middleware

# Copy package.json and package-lock.json 
COPY package.json package-lock.json /app/auth/
COPY auth.js /app/auth/
COPY db.js /app/auth/
COPY .env /app/auth/
COPY node_modules/ /app/auth/ 
COPY authMiddleware.js /app/auth/middleware
# Install dependencies
RUN npm install
# Copy the rest of the application files

# Expose port
EXPOSE 3000
# Specify the entry point
CMD ["node", "auth.js"] 

