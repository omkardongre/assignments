import { Hono } from 'hono'

const app = new Hono()



import { PrismaClient } from '@prisma/client/edge'
import { withAccelerate } from '@prisma/extension-accelerate'
import jwt from '@tsndr/cloudflare-worker-jwt'



const prisma = new PrismaClient({
  datasources: {
    db: {
      url: "prisma://accelerate.prisma-data.net/?api_key=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfa2V5IjoiOTAwOTc2ZDYtN2FjMC00NDA0LThjZTMtY2M4YTlmYjI2NWY5IiwidGVuYW50X2lkIjoiNmFlNjJjODA5MDFiNmRkNTNiNmY4YTZjOTBiNWFkYzRjYmU3M2JkYTNmOTY3NTljOGU2ZGM1NGM3MmRhZTYyYyIsImludGVybmFsX3NlY3JldCI6ImVhYjM1ODViLTM2M2MtNDU3MC1hYTk3LWZlMDFhOWI4OTI4OSJ9.0OUJziJPs4lNCUKSC2YOxpg8TOvTkH3GLWNGHaBEMco"
    }
  }
}).$extends(withAccelerate())

app.get('/', (c) => c.text('Hello World'));

app.post('/user/signup', async (c) => {
  const body = await c.req.json()

  console.log(body);


    // Validate input data
    if (!body.username || !body.email || !body.password) {
      return c.json({ message: "Missing required fields", error: true }, 400);
    }
  
    try {
      // Attempt to create user in Prisma database with unique email constraint
      const user = await prisma.user.create({
        data: {
          username:body.username,
          email:body.email,
          password:body.password, 
      
        },
      });  
      return c.json({ message: "User created successfully", user }, 201);
    } catch (error:any) {
      // Handle potential Prisma errors, like unique constraint violation
      if (error.meta?.originalError?.code === 'P2002') {
        return c.json({ message: "Email already in use", error: true }, 400);
      } else {
        console.error(error); // Log unexpected errors for debugging
        return c.json({ message: "Internal server error", error: true }, 500);
      }
    }

})

app.post('/user/signin', async (c) => {
  const body = await c.req.json()


    // Validate input data
    if (!body.email || !body.password) {
      return c.json({ message: "Missing required fields", error: true }, 400);
    }

    try {
      // Attempt to find user in Prisma database with matching email and password
      const user = await prisma.user.findFirst({
        where: {
          email: body.email,
          password: body.password,
        },
      });

      console.log(user);



      if (!user) {
        return c.json({ message: "Invalid email or password", error: true }, 401);
      }

      // Generate JWT token for authenticated user
      const token = await jwt.sign({ id: user.id}, 'secret');
      return c.json({ message: "Login successful", token }, 200);
    } catch (error) {
      console.error(error); // Log unexpected errors for debugging
      return c.json({ message: "Internal server error", error: true }, 500);
    }
})

app.get('/posts/:id', async (c) => {

  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ message: "Missing authorization token", error: true }, 401);
  }

  // Verify the token and retrieve the user ID.
  const isInValid = await jwt.verify(token, 'secret')

  if (isInValid) {
    return c.json({ message: "Invalid authorization token", error: true }, 401);
  }

  const id:number = parseInt(c.req.param('id'))


  const post = await prisma.post.findFirst({ where: { id } });

  if (!post) {
    return c.json({ message: "Post not found", error: true }, 404);
  }

  return c.json({ message: "Post retrieved successfully", post }, 200);
})



app.get('/posts', async (c) => {
  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ message: "Missing authorization token", error: true }, 401);
  }

  // Verify the token and retrieve the user ID.
  const isInValid = await jwt.verify(token, 'secret')

  if (isInValid) {
    return c.json({ message: "Invalid authorization token", error: true }, 401);
  }


  const { payload } = await jwt.decode(token)

  const posts = await prisma.post.findMany({ where: { authorId:  payload.id} });
  return c.json({ message: "Posts retrieved successfully", posts }, 200);

})




app.post('/posts', async (c) => {
  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ message: "Missing authorization token", error: true }, 401);
  }

  // Verify the token and retrieve the user ID.
  const isInValid = await jwt.verify(token, 'secret')

  if (isInValid) {
    return c.json({ message: "Invalid authorization token", error: true }, 401);
  }

  const { payload } = await jwt.decode(token)

  const body = await c.req.json()

  const post = await prisma.post.create({
    data: {
      title: body.title,
      body: body.body,
      authorId: payload.id,

    },
  });

  return c.json({ message: "Post created successfully", post }, 201);
})

// - PUT /posts/:id - Update a blog post by ID.
// Inputs: title, body
// Actions: Update the specified blog post if the authenticated user is the owner. 
// Require authentication.

app.put('/posts/:id', async (c) => {
  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ message: "Missing authorization token", error: true }, 401);
  }

  // Verify the token and retrieve the user ID.
  const isInValid = await jwt.verify(token, 'secret')

  if (isInValid) {
    return c.json({ message: "Invalid authorization token", error: true }, 401);
  }

  const id:number = parseInt(c.req.param('id'))

  const post = await prisma.post.findFirst({ where: { id } });

  if (!post) {
    return c.json({ message: "Post not found", error: true }, 404);
  }

  const { payload } = await jwt.decode(token)


  if (post.authorId !== payload.id) {
    return c.json({ message: "You are not the owner of this post", error: true }, 401);
  }

  const body = await c.req.json()
  
  const updatedPost = await prisma.post.update({
    where: { id },
    data: {
      title: body.title,
      body: body.body,
    }
  })
  return c.json({ message: "Post updated successfully", updatedPost }, 200);

})


// - DELETE /posts/:id - Delete a blog post by ID.
// Actions: Delete the specified blog post if the authenticated user is the owner.
//  Require authentication.


app.delete('/posts/:id', async (c) => {
  const token = c.req.header('Authorization')

  if (!token) {
    return c.json({ message: "Missing authorization token", error: true }, 401);
  }

  // Verify the token and retrieve the user ID.
  const isInValid = await jwt.verify(token, 'secret')

  if (isInValid) {
    return c.json({ message: "Invalid authorization token", error: true }, 401);
  }

  const id:number = parseInt(c.req.param('id'))

  const post = await prisma.post.findFirst({ where: { id } });

  if (!post) {
    return c.json({ message: "Post not found", error: true }, 404);
  }

  const { payload } = await jwt.decode(token)


  if (post.authorId !== payload.id) {
    return c.json({ message: "You are not the owner of this post", error: true }, 401);
  }

    const deletedPost = await prisma.post.delete({
      where: { id }
    })

    return c.json({ message: "Post deleted successfully", deletedPost }, 200);
})



export default app
