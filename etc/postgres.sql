CREATE USER "test-user" WITH PASSWORD 'test-password';
CREATE DATABASE participant1;
GRANT ALL ON DATABASE participant1 TO "test-user";


CREATE DATABASE mydomain;
GRANT ALL ON DATABASE mydomain TO "test-user";
