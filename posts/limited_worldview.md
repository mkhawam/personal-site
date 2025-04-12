---
title: "Limited Worldview"
description: "How to create a limited worldview to create easier to manage and more secure applications."
date: 2024-04-12 12:00:00
tags: [clean-code, security, software-engineering, software-design, software-architecture]
author: Mohamad Khawam
author_image: https://avatars.githubusercontent.com/dominusmars
image: /img/coding.png
---

Code is a powerful tool which allows us to create complex systems. Throughout the years, there has been a lot of discussion about how to create better clearer code. There are many different paradigms and styles of programming, each with there own set of rules and guidelines. It seems like every person has their own opinion on how to write code. Just like writing an essay or taking notes, most of the time writing code is just how do you/your team write code that is easy to read or understand? I might be adding another view to the mix, but I hope to take a different approach to the problem. There's hard rules like no line above 80 charatcters, or keeping all functions under a certain line leagth. But these create there own draw backs plus theres no telling why a line thats 81 characters long is worst then a 80 character one for example.

```typescript
return { title, description, date, tags, author, author_image, content, slug, image };
```

This line is about 86 characters long, for some this is easier to read then the following:

```typescript
return {
    title,
    description,
    date,
    tags,
    author,
    author_image,
    content,
    slug,
    image,
};
```

The first one is more compact to one line but the second one is easier to read for some people. The frist one helps keep our functions to a smaller height, but the second one keeps the line length down. So which one is better? I really don't know. I've used both styles in programming this website.

There in lies the problem, one programmer might prefer one style over the other and even use the different styles as they are programming. There isn't a good framework to judge the code we use and how we write it. So how do we create a better code base?

# Limited Worldview

Instead of focusing on the code itself, we could focus more on the worldview. What does the code believe is happening at this line of the code? When we code we automatically do this for example

```python
@app.route('/user', methods=['POST'])
def create_user():
    # Create a new user
    name = request.json.get('name')
    email = request.json.get('email')
    db.session.add(name, email)
    db.session.commit()
    return jsonify(user.to_dict()), 201
    pass
```

In this snippet of a post endpoint, we are creating a new user. At line 5, we believe that the name and email are in the request and we are passing those on to the database to handle. Here our worldview is just that belief. The code is simple but its also error prone. What if the request is empty or malformed? Should we handle that in the database class or do we handle that here in the endpoint? All of these questions are valid to ask and we asked them basically on a daily basis. All of these questions enforce us to think about what is true and what is not true. We are creating a worldview in our heads.

Firstly, more code is not less clean code. There's definitely a corrolation between the amount of code and the amount of bugs. For example, no code means no bugs but then it doesn't do anythings. Just because we have an extra line of code somewhere or an extra function, doesn't mean that code is harder to read. Instead, we should focus more on creating a limited worldview. Limited the world itself to smaller set of rules and beliefs which help us better understand the code. For example

```python
@app.route('/user', methods=['POST'])
def create_user():
    # Create a new user
    name = request.json.get('name')
    email = request.json.get('email')
    if not name or not email:
        return jsonify({"error": "Name and email are required"}), 400
    db.session.add(name, email)
    db.session.commit()
    return jsonify(user.to_dict()), 201
```

Here, we are using a guard clause to check if the name and email are presend before continuing. Limiting the worldview to assert that both name and email need to be present. This limits the scope of the code allowing us later on to validate that something is wrong. Example if we find that the name is empty in the database we can assume that the worldview is wrong. And we need to enforce it somewhere else. Thinking about it in this way allows us to understand the code based on the worldview that its trying to enforce, and also allows us to debug code later on.

Enforcing the worldview also creates more secure applications too. For example, if we sanitize the input for the name and email, we can assume that the input is safe to put in the database. This allows us to spot potential security issues in the code, before it becomes a problem.

Now we can start focusing different ways of enforing the worldview.

# Enforcing the Worldview

When enforcing a worldview we must focus on both explicit delcarations and implicit declarations of the worldview. The worldview entiltles the set of rules and beliefs we have about the code. This starts with the naming of variables and functions. For example, if we have a function called `create_user` we can assume that this function is going to create a user in this codebase. If this function was named something different like `create_user_entry` we might assume the function is going to create a user entry or post in the database. Depending on the context of the rest of the code. Simply by changing the name of the function we are changing how we think about the function and how it fits into what we know about the worldview. Similarly, if we make a variable called `name` under this function we can assume that this variable is going to be a the name of the `user`. If we change the name of the variable to `name_of_entry` we might assume that this variable is going to be the name of the entry in the database. Simply changing the name of the variable and function changes how we think about the code and visa versa we can use it to enforce a certain worldview. Another way to enforce an implicit worldview is using type defintions and type hints.

```python
def create_user(name: str, email: str) -> User:
    user = User(name=name, email=email)
    db.session.add(user)
    db.session.commit()
    return user
```

Here, we are using type hints to enforce an implicit worldview, we are saying to the compiler that name and email are both string and return a user. This allows us to enforce the worldview of both name and email being defined and a stirng. At compiler time, we check that the functions that use this function assume that they are going to input a name and email of type string, and get back a user object. This limits the scope of what this function does making it simple to understand and test. If I put both a name and email of type string, then I will get a user object back. The implicit worldview allows us to enforce the worldview at compile time. Its a good starting point to enforce the worldview. But we can go further and enforce a more explicit worldview.

```python
def create_user(name: str, email: str) -> User:
    if not name or not email:
        raise ValueError("Name and email are required")
    user = User(name=name, email=email)
    db.session.add(user)
    db.session.commit()
    return user
```

Using guard clauses and exceptions we can enforce a more explicit worldview. Here we are checking if the name and email are present before creating the user. This allows us to enforce the worldview that both name and email are required. If we try to create a user without a name or email the worldview becomes enforced and we get a exception. This is a good way of making sure that at runtime, functions behave according to the worldview.

Another way to do this is enforcing object forms. This allows us to enforce the worldview explicitly and implicity. For example, we can create user object which enforces its form.

```python
class User():
    def __init__(self, name: str, email: str):
        if not name or not email:
            raise ValueError("Name and email are required")
        if not isinstance(name, str) or not isinstance(email, str):
            raise TypeError("Name and email must be strings")
        self.name = name
        self.email = email

    def __repr__(self):
        return f"User(name={self.name}, email={self.email})"
```

# Conclusion

In this post, we have discussed how to create a limited worldview to create easier to manage and more secure applications. We have also discussed how to enforce the worldview using explicit and implicit declarations. The goal is to create a worldview that is easy to understand and test. This allows us to create code that is easier to read and understand. It also allows us to create code that is easier to debug and test. By enforcing the worldview we can create code that is easier to manage and more secure.

Each programming language has its own way of enforcing the worldview. The goal is to use what each language provides to enforce worldviews instead of just writing `clean` code. When we enforce worldview we are creating the set of rules and beliefs that we have about the code. This allows us to debug and test the code better. Instead of focusing on the code itself and the styles which we can use, we should focus more on what is this code trying to do and how can we enforce that. In all, the goal is to create a worldview that correctly represents the code and its purpose. By enforcing the worldview we can create code that is both easier to read and understand.

# Sources

-   https://www.esecurityplanet.com/endpoint/prevent-web-attacks-using-input-sanitization/
-   https://www.owasp.org/index.php/Input_Validation_Cheat_Sheet
