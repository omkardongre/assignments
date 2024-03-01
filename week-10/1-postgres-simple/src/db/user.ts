import { client } from "..";

/*
 * Should insert into the users table
 * Should return the User object
 * {
 *   username: string,
 *   password: string,
 *   name: string
 * }
 */


export async function createUser(username: string, password: string, name: string) {
    const insertQuery = `Insert into Users (username, password, name) values ($1, $2, $3)`;
    const value = await client.query(insertQuery, [username, password, name]);
    return value.rows[0];
}

/*
 * Should return the User object
 * {
 *   username: string,
 *   password: string,
 *   name: string
 * }
 */
export async function getUser(userId: number) {
    const selectQuery = `Select * from Users where id = $1`;
    const value = await client.query(selectQuery, [userId]);
    return value.rows[0];    
}
