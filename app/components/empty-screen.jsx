const exampleMessages = [
  {
    heading: "Talk about Rishi's work experience",
    message: `Where all did Rishi work at?`,
  },
  {
    heading: "Talk about Rishi's coding setup",
    message: 'What all does Rishi uses for coding setup?',
  },
  {
    heading: "Talk about Rishi's non-work experience",
    message: 'What all do you know about Rishi apart from his professional work experience?',
  },
]

export function EmptyScreen({ handleFormSubmission }) {
  return (
    <div className="mt-8 w-full px-4">
      <div className="rounded-lg border bg-background p-8 shadow">
        <h1 className="mb-2 text-lg">Welcome to Custom Content AI ChatBot!</h1>
        <p className="leading-normal text-muted-foreground">You can start a conversation here or try the following examples:</p>
        <div className="mt-4 flex flex-col space-y-2">
          {exampleMessages.map(({ heading, message }, index) => (
            <div
              key={index}
              variant="link"
              className="text-base cursor-pointer"
              onClick={() => {
                document.getElementById('message').value = message
                handleFormSubmission()
              }}
            >
              <span className="text-black/50">&rarr;&nbsp;&nbsp;</span>
              <span className="hover:underline">{heading}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
