import { Router } from "express";

export default function testRouter(router: Router) {

  router.get("/test-error", (req, res) => {
    throw new Error("Test error working!");
  });

}
