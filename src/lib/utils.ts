export const parseJsonList = (input: string): Object[] => {
  const regex = /{\n[\s\S]*?\n}/g

  // Use the regex to find all matches in the input string
  const matches = input.match(regex)

  // Parse each match as JSON and collect the results in an array
  // If there are no matches, return an empty array to avoid errors
  if (!matches) {
    return []
  }

  const objects = matches.map((match) => JSON.parse(match))

  return objects

}
