-- Complete fix for voting policies to prevent infinite recursion

-- First, drop ALL existing policies on the votes table
DROP POLICY IF EXISTS "Users can view votes for active polls" ON votes;
DROP POLICY IF EXISTS "Users can vote once per poll" ON votes;
DROP POLICY IF EXISTS "Users can update their own votes" ON votes;
DROP POLICY IF EXISTS "Users can delete their own votes" ON votes;
DROP POLICY IF EXISTS "Users can insert their own votes" ON votes;

-- Now create the correct policies without infinite recursion
CREATE POLICY "Users can view votes for active polls" ON votes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM polls 
      WHERE polls.id = votes.poll_id 
      AND polls.is_active = true
    )
  );

-- Simple insert policy - no recursion
CREATE POLICY "Users can insert their own votes" ON votes
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Update policy
CREATE POLICY "Users can update their own votes" ON votes
  FOR UPDATE USING (auth.uid() = user_id);

-- Delete policy
CREATE POLICY "Users can delete their own votes" ON votes
  FOR DELETE USING (auth.uid() = user_id);

-- Verify the policies are correct
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
FROM pg_policies 
WHERE tablename = 'votes';
