#!/bin/bash
set -e

psql -v ON_ERROR_STOP=1 --username "$POSTGRES_USER" <<-EOSQL
    create role stsbow with login password 'stsbow';
    create database stsbow with owner stsbow;
    create database stsbow_shadow with owner stsbow;

    CREATE EXTENSION IF NOT EXISTS cube;
    CREATE EXTENSION IF NOT EXISTS earthdistance;
EOSQL
