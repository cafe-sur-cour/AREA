# Project Comunnication

Here you cna find example of the comunication of the project.
One a basic level the mobile and the web app both communicate with our restAPI, wich allows communication to the database.


### Sequence Diagram

![Sequence Diagram](/img/sequence-diagram.png)


**1. User Configures an Applet**

    The User tells the Platform: “If [Trigger] then [Action].”
    The Platform stores this rule and subscribes to the Trigger service (either by registering a webhook or preparing to poll).

**2. Trigger Fires**

    The Trigger Service detects an event (e.g., “new email received” or “temperature above 30°C”).
    It notifies the Platform: this can happen via a webhook push (event sent immediately) or the Platform periodically polling the Trigger service for updates.

**3. Platform Processes the Event**

    The Platform receives the event and checks:
    Which applets are linked to this Trigger.
    Whether conditions/filters apply (e.g., “only if subject contains ‘invoice’”).
    If needed, it refreshes or validates authentication (OAuth tokens).

**4. Platform Executes the Action**

    The Platform sends an API request to the Action Service (e.g., Slack, Google Sheets, smart light, etc.).
    If the applet has multiple actions, the Platform might chain or parallelize them.

**5. Action Service Responds**

    The Action Service replies with success or failure (e.g., 200 OK, or error).
    The Platform records this result and may notify the User (success, failure, or retry attempt).

**6. Failure Handling (Optional)**

    If an action fails (e.g., API timeout), the Platform retries or queues it for later execution.
    In more advanced setups, failures may be pushed into a Dead Letter Queue (DLQ) for inspection.


### Integration Diagram
![Diagram Integration](/img/integration-schema.png)

Here you can see a basic exchange of data giving you an idea of the logic behind.


### Data Flux Diagram
![Diagram Data Flux](/img/data-flux-schema.png)

Here you can see a data flux diagram that explains how the data flows from auser all the way to the output.

