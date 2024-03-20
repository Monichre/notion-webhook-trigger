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
  // Split the input string by the closing and opening markdown code block markers
  // to separate each JSON object. This regex looks for occurrences of "}```json{" or "}```{" considering
  // some inputs might not strictly follow the "```json" marker.
  // const jsonStrings = input.split(/}```(?:json)?{/).filter(Boolean)

  // // Add the first and last curly braces back to each JSON string, except for the first and last split parts,
  // // since the first part will already have an opening brace and the last part will already have a closing brace.
  // const objects = jsonStrings.map((jsonString, index) => {
  //   let adjustedJsonString = jsonString
  //   if (index > 0) {
  //     adjustedJsonString = `{${adjustedJsonString}`
  //   }
  //   if (index < jsonStrings.length - 1) {
  //     adjustedJsonString = `${adjustedJsonString}}`
  //   }

  //   // Remove any potential leading or trailing whitespaces and newlines
  //   adjustedJsonString = adjustedJsonString.trim()

  //   return JSON.parse(adjustedJsonString)
  // })

  // return objects
}
