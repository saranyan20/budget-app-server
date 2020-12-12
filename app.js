let http = require("http");
let url = require("url");
let express = require("express");

const gql = require("graphql-tag");
const ApolloClient = require("apollo-boost").ApolloClient;
const fetch = require("cross-fetch/polyfill").fetch;
const createHttpLink = require("apollo-link-http").createHttpLink;
const InMemoryCache = require("apollo-cache-inmemory").InMemoryCache;
const queries = require("./queries");

const app = express();

const client = new ApolloClient({
	link: createHttpLink({
		uri: "https://budget-app.hasura.app/v1/graphql",
		fetch: fetch,
	}),
	cache: new InMemoryCache(),
});

console.log("server started");

const loginDetails = () => {
	return new Promise((resolve, reject) => {
		client
			.mutate({
				mutation: queries.GET_LOGIN_DETAILS,
			})
			.then((res) => {
				const result = res.data.budget_app_login;
				resolve(result);
			})
			.catch((err) => {
				console.log(err);
				reject(err);
			});
	});
};

const getBudgetDetails = (loginArray) => {
	for (const el of loginArray) {
		let incomeList = [];
		let expenseList = [];

		client
			.mutate({
				mutation: queries.GET_BUDGET_DETAILS,
				variables: { login_id: el.id },
			})
			.then((res) => {
				const result = res.data.budget_app_budget_details;
				if (result.length > 0) {
					for (const el of result) {
						if (el.type == "Income") incomeList.push(el);
						else if (el.type == "Expense") expenseList.push(el);
					}

					let totalIncome = getBudgetAmount("Income", incomeList);
					let totalExpense = getBudgetAmount("Expense", expenseList);

					Promise.all([totalIncome, totalExpense]).then(([income, expense]) => {
                        console.log('budget - ',income - expense);
                        let amount = income - expense
                        insertEachMonthSavings(el.id, amount);
                    });

				}
			})
			.catch((err) => {
				console.log(err);
				reject(err);
			});
	}
};

const getBudgetAmount = (type, list) => {
	return new Promise((resolve, reject) => {
		let amount = 0;

		let total = 0;

		for (const el of list) {
			total += el.amount;
		}

		if (type == "Income") {
			amount = total;
		} else if (type == "Expense") {
			amount = total;
		}

		resolve(amount);
	});
};

const insertEachMonthSavings = (login_id, amount) => {
	console.log("entered");
	client
		.mutate({
			mutation: queries.INSERT_MONTHLY_SAVINGS,
			variables: {
				login_id,
				amount,
			},
		})
		.then((res) => {
			const result = res.data.insert_budget_app_monthly_savings.returning;
			console.log(result);
			if (result[0].id > 0) {
				console.log(result);
			}
		})
		.catch((err) => {
			console.log(err);
		});
};

app
	.get("/insert-monthly-savings", (req, res) => {
		console.log("entered");

		loginDetails()
			.then((res) => {
				getBudgetDetails(res);
			})
			.catch((err) => {
				console.log(err);
			});
	})
	.listen(8000);

    // 00 12 13 1-12 *