import type { NextApiRequest, NextApiResponse } from "next";
import { tx } from "../../../src/backend/pg";
import {
  getChangedEntries,
  getChangedLastMutationIDs,
  getClientGroup,
  getGlobalVersion,
} from "../../../src/backend/data";
import { z } from "zod";
import type { PullResponse } from "replicache";

const pullRequestSchema = z.object({
  clientGroupID: z.string(),
  cookie: z.union([z.number(), z.null()]),
});

type PullRequest = z.infer<typeof pullRequestSchema>;

const authError = {};

export default async function (req: NextApiRequest, res: NextApiResponse) {
  const { body: requestBody } = req;
  const userID = req.cookies["userID"] ?? "anon";

  console.log(`Processing pull`, JSON.stringify(requestBody, null, ""));
  const pullRequest = pullRequestSchema.parse(requestBody);

  let pullResponse: PullResponse;
  try {
    pullResponse = await processPull(pullRequest, userID);
  } catch (e) {
    if (e === authError) {
      res.status(401).send("Unauthorized");
    } else {
      console.error("Error processing pull:", e);
      res.status(500).send("Internal Server Error");
    }
    return;
  }

  res.status(200).json(pullResponse);
}

async function processPull(req: PullRequest, userID: string) {
  const { clientGroupID, cookie: requestCookie } = req;

  const t0 = Date.now();

  const entries = Array.from(Array(1000)).map((_, i) => ({
    op: "put" as const,
    key: `${i}`,
    value: { id: i, text: `Todo ${i} ${Date.now()}`, completed: false },
  }));

  console.log("Read all objects in", Date.now() - t0);

  // TODO: Return ClientStateNotFound for Replicache 13 to handle case where
  // server state deleted.

  const res: PullResponse = {
    lastMutationIDChanges: {},
    cookie: (requestCookie || 0) + 1,
    patch: entries,
  };


  return res;
}
