---
title: "Leaky Endpoints in Jersey CTF 2025"
description: "How improerly configured endpoints can lead to data leaks."
date: 2024-04-09 12:00:00
tags: [exploit, react, golang, jersey_ctf, leaky_endpoints, vulnerability, 2025]
author: Mohamad Khawam
author_image: https://avatars.githubusercontent.com/dominusmars
image: /img/smoke_and_mirrors.png
---

# Background

Over the winter break, I was watching a [video](https://youtu.be/JA4Vii3tyUk) on how an oversea McDonald's website which allowed users to see other users orders. The misconfigured endpoint allowed users who are logged in to see all other orders being made. Not just that but also allowed users to modified other users. The website didn't do any authication for users and allowed for users to once authicationed to make API calls to endpoints that were not meant for them. This got me thinking about how this could be done in a CTF challenge.

My experience with Express JS helped me understand how this could have been done. Endpoints usually have middleware functions which authicates the user before sending the request to the controller. If the middleware doesn't do any checks if a user is able to contact the endpoint, then the user can just send a request to the endpoint and get the data. After that the controller assumes that the request is auticated leading to a data leak. In owasp terms this is call, [Broken Access Control](https://owasp.org/Top10/A01_2021-Broken_Access_Control/). Where an application is misconfigured and allows users to access endpoints that they are not supposed to. It was time to get to work!

Althrough my love for Express JS is unmatched, my friends never hear the end of me telling them to use NodeJS, For this challenge I also wanted to challenge myself to create something different. I began to use Golang and React instead of my usual stack of NodeJS and React. Similar to Node JS, Golang has a built in http service which you can use to make functions and also a wrapper libaray called Gin to create controllers for endpoints. Perfect for what I wanted to do. I choose React simply because I knew how to use it well for a frontend.

Throughout this write up I'll be going over both from a challenger side and also from a development side. To give a more hostistic point of view on how challlenges like this one are made.

# The Challenge

## Leaky-Endpoints

`A client wanted me to create a website for their restaurant. I wouldn't worry too much about giving your order details, but clients are weird, right? Unfortunately, the admin keeps using their personal information as passwords. I keep telling them that I'll set a good flag, but they never listen.`

The challenge had a few different goals, I wanted it to be hard but also reasonable enough for attacks who are knowlegable in web to understand. Firstly, the name gives a big hint to what it might be. Leaky Endpoints is a term used to describe endpoints which are improperly configured allowing users to access data that they aren't suppose to. This means that without proper authication users can extract data from the server that they shouldn't be able to see. Lets take a look at the code to see how this was done.


```go

func SetupOrderRoutes(router *gin.RouterGroup) {
	router.POST("/create", utils.Authenticate, createOrder)
	router.POST("/confirm", utils.Authenticate, confirmOrder)
	router.POST("/update", utils.Authenticate, updateOrder)
	router.GET("/:user_id/:id", utils.Authenticate, getOrder)
	router.GET("/:user_id", utils.Authenticate, getOrders)
}

...

func getOrder(ctx *gin.Context) {

	orderIDParam := ctx.Param("id")

	orderID, err := strconv.Atoi(orderIDParam)
	if err != nil {
		ctx.JSON(400, gin.H{"error": "Invalid order ID"})
		ctx.Abort()
		return
	}

	order, err := models.GetOrder(orderID)
	if err != nil {
		ctx.JSON(400, gin.H{"error": "Order not found"})
		ctx.Abort()
		return
	}

	ctx.JSON(200, order)
}

```

Interestly here, that there is a middleware function which means users are authicationed before there able to access the endpoint. However, just because a user is authicationed doesn't mean they have the write to access this data. Lets take a look at the middleware function to see how it works.

```go
func Authenticate(ctx *gin.Context) {
	cookie, err := ctx.Request.Cookie("token")
	if err != nil {
		ctx.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	token, err := jwt.Parse(cookie.Value, func(token *jwtUnfortunately, the admin keeps using their personal information as passwords..Token) (interface{}, error) {
		return []byte(jwtSecert), nil
	})
	if err != nil {

		ctx.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})
		return
	}

	if !token.Valid {

		ctx.AbortWithStatusJSON(401, gin.H{"error": "Unauthorized"})

		return
	}
	ctx.Next()
}
```

Its simply checking for the user to be logged in, this means any user who is logged in can access the endpoint and get any order on the system. Looking back, at the endpoint itself it seems to take in two params the order_id and also the user_id. but it doesn't check if the user is allowed to view a order_id. This would require a backend check to the database to see what orders the user is authicationed to see. You'll notice during the challege however, just because you were able to see another users order there was no order with the flag. Theres more to the server then just one leaky endpoint.

The challege descripion gave us our next hint, "Unfortunately, the admin keeps using their personal information as passwords." Inside one of the orders there was a admin order, to make it easier it was the first order entry into the database. After getting that order you were able to see the personal data of the admin, There was alittle bit of guessing in this part but after using the phone number the attacker were able to log into the admin user.

```json
{
	"Name":         "Admin User",
	"Full_address": "123 Main St",
	"State":        "NJ",
	"Country":      "USA",
	"Postal_code":  "12345",
	"Phone":        "5511111111",
	"Card":         "1234567890123456",
	"Cvv":          "123",
	"Expiry":       "12/25",
}
```


Next, there were a few different ways to go about solving this depending on which ones an attacker find first. One thing I like to do is take a look at the network in the devtools tab first to see what requests are being made. to see what requests and responses are being made. Prehaps there are some requests that were preveiously unauthorized but now are. Some websites will have a developer version enabled when an admin is logged in. In this case its a react application so theres a easier way to see this in action. A little bit about how react applications work, more specifically single page react applications. Its a bunch of javascript in a single file. This bundle of javascript holds all the applications infomation about how to navigate the site. The infomation holds all the endpoints. You can find it by looking at the inital request made to the page. If it like something of the following, you know your dealing with a single page Javascript application

```html
<!doctype html>
<html lang="en">
    <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <title>Smoke & Mirrors</title>
        <script src="/static/bundle.js" defer></script>
        <link rel="icon" href="/static/favicon.ico" />
    </head>
    <body >
        <div id="root" ></div>
    </body>
</html>
```

Taking a look at the html take you'll see `/static/bundle.js`. Thats the entry point into the react application and after that runs the website is rendered. The easiest way, I recommend using the devtools to inspect that file because it allows you to set breaking points and see what calls are happening on the client. React uses something called the React Router, which tells the client code which web view it should render depending on the webpage. Looking for React Router in the code, you'll find the following.

```javascript
function App() {
    return (react_1.default.createElement("div", { className: "App" },
        react_1.default.createElement("header", { className: "App-header" },
            react_1.default.createElement(NavMenu_1.default, null)),
        react_1.default.createElement("div", { className: "App-body" },
            react_1.default.createElement(react_router_1.Routes, null,
                react_1.default.createElement(react_router_1.Route, { path: "/", Component: Home_1.default }),
                react_1.default.createElement(react_router_1.Route, { path: "/Menu", Component: Menu_1.default }),
                react_1.default.createElement(react_router_1.Route, { path: "/Order", Component: OrderSummary_1.default }),
                react_1.default.createElement(react_router_1.Route, { path: "/Checkout", Component: Checkout_1.default }),
                react_1.default.createElement(react_router_1.Route, { path: "/@dMiN", Component: Admin_1.default }),
                react_1.default.createElement(react_router_1.Route, { path: "/Orders/:user_id/:id", Component: Orders_1.default }))),
        react_1.default.createElement("footer", { className: "footer sm:footer-horizontal footer-center bg-base-300 text-base-content p-4" },
            react_1.default.createElement("aside", null,
                react_1.default.createElement("p", null,
                    "Copyright \u00A9 ",
                    new Date().getFullYear(),
                    " - All right reserved by S&M Industries Ltd")))));
}
```
These are all the different web views for the application. The important one to note is the `/@dMiN` endpoint. This is the admin page for the application. And going to it on the browser will give an admin dashboard. The dashboard is a simple page which showed some statstics. Either going to the page or looking more in depth in the bundle you'll find the admin api endpoints, 3 in total.

```txt
/api/admin/status
/api/admin/users/${value}
/api/admin/dev/users/${value}
```

There's a acquious call to a what seems like a developer endpoint? Lets take a look at the code to see what it does. Challengers were able to see the user id being sent to both endpoints. This keyed them into it was some call to the database.

```go
func SetupAdminEndpoints(r *gin.RouterGroup) {
	r.GET("/orders", utils.AdminCheck, getOrders)
	r.GET("/status", utils.AdminCheck, getStatus)
	r.GET("/users", utils.AdminCheck, getUsers)
	r.GET("/users/:id", utils.AdminCheck, getUser)
	r.GET("/dev/users/:id", utils.AdminCheck, getUserVulnerable)
}

// Vulnerable to SQL injection endpoint, but accessable only to admins
func getUserVulnerable(ctx *gin.Context) {

	var idParam = ctx.Param("id")
	db := models.GetReadOnlyDB()
	query := "SELECT name FROM users WHERE id = " + idParam

	rowsQuery, err := db.Query(query)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to get user: " + err.Error()})
		return
	}

	defer rowsQuery.Close()

	var rows []map[string]interface{}
	for rowsQuery.Next() {
		var name string
		if err := rowsQuery.Scan(&name); err != nil {
			ctx.JSON(500, gin.H{"error": "Failed to scan user: " + err.Error()})
			return
		}
		rows = append(rows, map[string]interface{}{
			"name": name,
		})
	}

	ctx.JSON(200, rows)

}

func getUser(ctx *gin.Context) {

	var idParam = ctx.Param("id")
	db := models.GetReadOnlyDB()

	var name string
	err := db.QueryRow("SELECT name FROM users WHERE id = ?", idParam).Scan(&name)
	if err != nil {
		ctx.JSON(500, gin.H{"error": "Failed to get user: " + err.Error()})
		return
	}

	ctx.JSON(200, gin.H{"name": name})
}
```

The non-developer endpoint, uses the QueryRow to query the database. This is more explict to ensure only one thing can be done, querying a single row of the databse with the id param. In the vulnerable endpoint, the query string is built using concatanation and simply Queries the database and is vulnerable to [sql injection](https://owasp.org/www-community/attacks/SQL_Injection). The database was an sqllite databse which meant there was a `sqlite_master` table which holds the table names for all the tables in the database. using the following command you can get the name of every table in the database.

```sh
curl http://leaky-endpoints.aws.jerseyctf.com/api/admin/dev/users/2%20UNION%20SELECT%20name%20FROM%20sqlite_master
```

After getting the table names, selecting the table flog3 and selecting the name from it will give you the flag!

```sh
curl http://leaky-endpoints.aws.jerseyctf.com/api/admin/dev/user/1%20UNION%20SELECT%20group_concat(name)%20FROM%20flog3
```


## Conclusion

Many times these vulnerabilities are coding into code bases on accident. Either rushing to get something working or not thinging about the consequences. This challenge was meant to demonstrate how even if a vulnerability is behide a login, a malicious users can still get access to it and exploit it. Thats why its important to take the time to secure critical users such as Admins and Root users. Ensuring that these users are protected. Its a recurring story of system adminstrators believing something is secure only to find out that one exploit on the front-end gives an attacker admin permissions. If an attack is available an attack will exploit it. Its not uncommon for vulnerabilities to be dismissed simply because there are behide a firewall or dashboard.

In all, Making this challege was a ton of fun and I hope to make many more in the future. This was my first time making a challenge like this. So I'm thankful for the oppurunity from Jerseyctf and two glad that it was reserved so well.

## Sources

- https://youtu.be/JA4Vii3tyUk
- https://owasp.org/www-community/attacks/SQL_Injection
- https://owasp.org/Top10/A01_2021-Broken_Access_Control/


## Future reading

This was a user impersonation exploit on a palo alto fire wall that allowed users to impersonate other users and possibly get root access.
https://security.paloaltonetworks.com/CVE-2024-3388
https://medium.com/@_crac/exploitation-of-vulnerability-affecting-palo-alto-globalprotect-gateway-3ac74c223b17
