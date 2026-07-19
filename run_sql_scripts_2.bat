docker exec -i hmcs-postgres psql -U hmcs_app -d hmcs_db < add_products.sql
docker exec -i hmcs-postgres psql -U hmcs_app -d hmcs_db < simulate_history.sql
docker exec -i hmcs-postgres psql -U hmcs_app -d hmcs_db < fix_pawning_active.sql
docker exec -i hmcs-postgres psql -U hmcs_app -d hmcs_db < fix_loan_types.sql
