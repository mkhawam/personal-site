---
title: "Code To Understand"
description: "Clean code doesn't just mean the fastest code."
date: 2025-08-01 T00:00:00Z
tags: [2025, Code, Clean Code, Software Development]
author: Mohamad Khawam
author_image: https://avatars.githubusercontent.com/mkhawam
image: /img/understandingcode.png
---

# Background

Lets start by taking a look at the code below:

```python
def post():

    # This function is responsible for handling the post request
    # It processes the data and returns a response
    data = request.get_json()
    if not data:
        return jsonify({"error": "No data provided"}), 400

    # Process the data
    processed_data = process_data(data, "user")

    # Return the response
    return jsonify({"data": processed_data}), 200

```

Here we have a simple function that handles a POST request. It retrieves some kind of JSON data, processes it, and returns a response. The code is functional, but do we really know what it's doing? A couple of weeks ago, I was working on a project where I needed to take over a codebase I had never seen before. The code was functional, with a lot of functions defined, but I had no idea what I was looking at. It was a new framework, a new language, and a new codebase. Much of the code was undocumented and six years old, and the worst part was that we needed to take over the project by the start of August for testing and deployment. I had to figure out how to understand the code quickly.

# The Problem

Time was ticking forward, and I was getting more and more frustrated. I needed to understand the code, but I didn't know where to start. Panic set in, and I started to doubt my own abilities. I felt like I was drowning in a sea of code, and I couldn't find a way out. I asked my colleagues for help, but they had their own tasks to complete. It was my responsibility to figure this heap of code out, and I was determined to do it. I needed to make this code my own and understand it piece by piece. Most importantly, this needed to happen quickly.

# Breaking It Down

Recoding the entire codebase was not an option. It was too large and too complex. I needed to find a way to break it down into smaller pieces so I could understand what I was dealing with. The codebase was divided into multiple repositories. After some exploration, I realized that the best way might be thinking ahead—looking at what I could potentially change in order to figure out what I needed to do. At this point, there were three main repos: the frontend, the backend, and an SDK written in Python. The frontend code was a mess and old enough that if I wanted to change anything within the deadline, it would have to be small. But what about taking the time to make something more sustainable? Currently, the connection between the frontend and backend was a React application that had a subdirectory for API calls to the backend. It handled the requests in a way that was super unclear and, in my opinion, over-engineered to the point of being unusable. Object creation functions and endpoint getter functions made it harder to grep through the code and find where things intersected. This made it virtually impossible for anyone but the creators to understand what was going on. Maybe if I had time, but I didn't. So I made a plan to kill two birds with one stone. I would create a new JavaScript SDK that would handle the requests to the backend and also help me understand the backend codebase. I would go step by step through each endpoint and each function to see exactly what it was doing. This would allow me to understand the codebase and also create a new SDK that I could implement in the frontend later on when I had the time.

As I started working on the SDK, problems with the backend codebase started to surface. The codebase was clean, but the functionality was not. Functions like the code above were everywhere—rabbit holes of functions and mapping functions in order to figure out what was going on. The code was functional and worked as intended, but it made it hard to understand what was happening. I realized that for the most part, I might need to assume what the code was doing and test it out. This was not ideal, but it was the only way to figure out what was going on and finish the SDK in time. I chose to start by implementing schemas and endpoints into the SDK. That would break down into functions which could be tested individually. I took a best guess at what the code was doing and implemented it into the SDK. If something was not working, something would break, and I could figure out what was going on. This was a slow, grinding process, but it was the only way to figure out what was happening. At least it allowed me to scan through the codebase and understand what was going on. The functionality was simple: take this data, process it, and return a response. But the way it was implemented made it harder to understand. It took me a while to figure out what was happening, but in the end, a new SDK was created, and the codebase was understood. Although problems still existed, at least I knew what they were and how to fix them.

# Changing the Code

After a week of working on the SDK, I better understood the codebase. But now the problems I had been faced with were starting to surface. The code was functional, but it was also coded to work within the cloud environment with microservices. We didn't have those services, and we didn't have the cloud environment. Nor did I want to put the application in the cloud when we had a private cloud we could use. This meant that I needed to refactor the code to work within our existing infrastructure. It's really easy to code in such a way that things work. As a programmer, it's easy to get caught up in the functionality of the code and forget about what and who is going to look at and inspect the code. Codebases become too big to take a step back and look at the code as a whole. But that's where the problems start to surface. Sometimes code that is functional becomes a functional mess to maintain and, more so, to understand. A simple function can become a rabbit hole of other functions and get lost in the codebase. Fast code can be cool, but it doesn't mean it's understandable. In the Python code above, process_data does exactly what it says, right? But what does it do? What data is it processing? What is the response? Would it help if it changed to process_post_data? The code is functional, but even if we added more description to the function name, we would still not know what it's doing. The code doesn't help us to understand what is going on. It doesn't give us any insight into the data being processed or the response being returned. A few ideas come to mind when thinking about how to improve this code. The main one is to remove the function and just put the code inside the handler. Another is bringing a better foundation to the codebase as a whole. Assuming that the codebase has a lot of these process_data functions, or maybe the function itself does a lot of things in different ways. What are some ways we can improve the codebase to make it more understandable?

# Code More, Not Less

Sometimes more code is a better solution than less code. The function above is a good example of less code. But sometimes, especially when building a foundation for code, more code is better. It allows us to make small black boxes which have one responsibility and can be easily tested and understood. Object creation functions can be broken down into objects which have a single responsibility. This might be more code, but it makes it easier to compartmentalize the code and help with understanding. Small compartments of code functionality. Instead of microservices, we have micro environments—objects!

It's no secret that many frameworks tend to be bloated and engineered to be easy to use, but there's a reason for this. And it can help us in coding our own codebases.

Frameworks are designed to be easy to use; you understand what the function is doing before you even use it. You expect what you will get back when you pass something into the function. For example, in the Discord SDK for message embeds:

```python
embed = discord.Embed(title="Hello", description="World")
embed.add_field(name="Field", value="Value")
await channel.send(embed=embed)
```

A programmer doesn't need to understand how the Discord SDK works and what it does with the title or description. They just need to know that they will get back an embed object that they can use to send a message. The code is functional, but it also gives us insight into where the code is used. It might be clunkier than just having a function, but it gives us a better understanding of how the code interacts with the rest of the codebase. It also allows us to compartmentalize the code, making it easier for us to implement. Now let's say you were the one that created the Discord SDK. If something is wrong with the embed object, or simply you wanted to add a new feature to it, you can easily do that without breaking the rest of the codebase. A new function can be added to the embed object, and it will not affect the rest of the codebase. A new parameter can be added to the discord.Embed function, and it will not affect the rest of the codebase. This is the power of compartmentalizing the code. It allows us to make changes to the code without breaking the rest of the codebase. It also allows us to understand the code better and how it interacts with the rest of the codebase.

# Where Does This Fit In?

While I was working on the new codebase, I realized that the main issue with the coding structure was this exact problem. The code might be functional, but it was not easily understandable. This made it harder to configure and maintain the codebase if I wanted to take it over. I needed to make some choices in recoding the codebase to make it more understandable. I needed to make the code more compartmentalizable. Taking inspiration from other SDKs and frameworks, I started to refactor the backend codebase, implementing a new structure that, while being more lines of code, made it easier to understand.

The codebase had helper functions for email templates, and another function which would format the parameters for those templates. This meant that there was a key used to get both the template and the parameters. This made it hard because that helper function was used in multiple places, but it was hard to understand what parameters were needed for each template. I decided to refactor the codebase to have a class for each template, and a function within the class which would handle creating the email object. This allowed me to compartmentalize the code and make it easier to understand each of the templates. Since some of the templates were meant to be user emails, I added an abstract class which would take a user object and subclasses would automatically have that user object available to them. This meant that if I added something to the user object, the email classes would automatically have access to it. This made it easier to understand the code and how it interacts with the rest of the codebase, making it easier to maintain and configure the codebase how I wanted to.

# Conclusion: Make Code Your Own

Code in a way that enables you to understand it. For me, compartmentalizing the code was the best way to do this. I'm exposed to a lot of frameworks and SDKs, so it makes sense to me and allows my head to think in that way. But for you, it might be different. The main point is to make the code your own. Make it easier for you and your colleagues to understand the code. Code which is easy to add functionality to is also easy to maintain. When you add something, ask yourself: How can I make this easier to understand? How can I make it easier to maintain? How can I make it easier to configure? If you can answer these questions, then you are on the right track. Sometimes these questions can be hard to answer, but they are important. They make sure your codebase is sustainable and can be maintained in the long run.
