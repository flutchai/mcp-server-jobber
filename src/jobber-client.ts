import axios, { type AxiosInstance } from "axios";
import type { JobberGraphQLClient } from "./types.js";

const GRAPHQL_ENDPOINT = "https://api.getjobber.com/api/graphql";
const API_VERSION = "2023-11-15";
const TIMEOUT_MS = 15_000;

export class JobberClient implements JobberGraphQLClient {
  private readonly http: AxiosInstance;

  constructor(accessToken: string) {
    this.http = axios.create({
      baseURL: GRAPHQL_ENDPOINT,
      timeout: TIMEOUT_MS,
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
        "X-JOBBER-GRAPHQL-VERSION": API_VERSION,
      },
    });
  }

  /**
   * Resolve token from tool args (_token) or env (JOBBER_ACCESS_TOKEN).
   * Cloud (shared process): _token in args per call.
   * OSS (dedicated process): JOBBER_ACCESS_TOKEN from env.
   */
  static resolveToken(args?: Record<string, any>): string {
    const token = args?._token || process.env.JOBBER_ACCESS_TOKEN;
    if (!token) {
      throw new Error(
        "No Jobber access token. Provide _token in args or set JOBBER_ACCESS_TOKEN env.",
      );
    }
    return token;
  }

  async query(query: string, variables?: Record<string, any>): Promise<any> {
    return this.execute(query, variables);
  }

  async mutate(mutation: string, variables?: Record<string, any>): Promise<any> {
    return this.execute(mutation, variables);
  }

  private async execute(
    query: string,
    variables?: Record<string, any>,
  ): Promise<any> {
    const response = await this.http.post("", { query, variables });
    const { data, errors } = response.data;

    if (errors?.length) {
      const messages = errors.map((e: any) => e.message).join("; ");
      throw new Error(`Jobber GraphQL error: ${messages}`);
    }

    return data;
  }
}
