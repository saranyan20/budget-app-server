const gql = require("graphql-tag");

const GET_LOGIN_DETAILS = gql`
	query MyQuery {
		budget_app_login {
			password
			user_name
			id
		}
	}
`;

const GET_BUDGET_DETAILS = gql`
	query($login_id: Int!) {
		budget_app_budget_details(order_by: { transaction_date: desc }, where: { login_id: { _eq: $login_id } }) {
			amount
			category
			description
			transaction_date
			type
		}
	}
`;

const INSERT_MONTHLY_SAVINGS = gql`
    mutation ($login_id: Int!, $amount: Int!) {
        insert_budget_app_monthly_savings(
            objects: { login_id: $login_id, amount: $amount }
        ) {
            returning {
                id
            }
        }
    }
`;

module.exports = {
    GET_LOGIN_DETAILS,
    GET_BUDGET_DETAILS,
    INSERT_MONTHLY_SAVINGS
};
