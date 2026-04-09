#!/bin/bash

rm datos.db
node load.js
node query.js > datos.csv