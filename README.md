# Rally WSAPI v2.0 Client for Node

## About
Axios client wrapper for interacting with the Rally Web Services API (v2.0)

### Prerequisites

This project has been built and tested using Node 20.x and is only available in CommonJS format.
Using Node 20.x or higher is recommended for the best operation. 

## Configuration

```
const { RallyClient, RallyQuery } = require("rally-wsapi");

const RALLY_API_KEY = "_abcdefghijklmnopqrstuvwxyz";

const clientConfig = { 
  debug: false,
  workspace: 123456789, 
  auth: { 
    key: RALLY_API_KEY 
  },
  headers: {
    "X-Custom-Header": 1
  },
  client: {
    rallyIntName: "Test Client",
    rallyIntVendor: "Cox Automotive, Inc.",
    rallyIntVersion: "1.0.0",
    rallyIntOS: "Linux",
    rallyIntPlatform: "Node",
    rallyIntLibrary: "Rally WSAPI for Node.js"
  }
};

const client = new RallyClient(clientConfig);

```

### Core Settings

- `server`: "https://rally1.rallydev.com"
- `serverPath`: "/slm/webservice/"
- `apiVersion`: "v2.0"
- `sortOrderDir`: "asc"
- `startIndex`: 1
- `pageSize`: 20
- `workspace`: ""
- `debug`: false

### Auth Settings

- Basic
    - `user`
    - `pass`
- API Key
    - `key`


## Query Operations

```
const config = {
    method: "get", 
    url: "/project",
    params: {
        start: 1, 
        pagesize: 200
    }
};

const response = await client.request(config);
```
If you don't want your parameters to be automatically parsed/modified, you can skip this by passing `false` as the second query parameter.  This may require you to set additional parameters such as the workspace to return correct results.

```
const response = await client.request(config, false);
```

A query configuration follows the Request Config pattern exposed by [Axios](https://axios-http.com/docs/req_config).  You can set any custom headers or parameters and the client will minimally process and enrich them to execute your query.

The client will automatically handle the following options for you:
- Base URL (https://rally1.rallydev.com/slm/webservice/v2.0)
- Auth (Setting Basic Auth or the API Key)
    - Keys are set on the `ZSESSIONID` header
- Content Type (application/json)
- Client Provided Details (ie: X-RallyIntegration headers)
- Page Start / Item Page Start (1)
- Page Size / Item Page Size (20)
- Workspace (/workspace/[your-workspace-param])
- Project (/project/[your-project-param])
- Fetch / Item Fetch / Shallow Fetch / Item Types
    - Automatic conversion from Array to Comma-Delimited String

You can override all of these default values by passing your own data through the client or query configs.

### Rally Syntax Query Builder

For more complicated queries that use `AND`, `OR`, `WHERE` the RallyQuery class is provided to correctly build and format your query string.

```
const query = RallyQuery
    .where('c_AutomationTool', '=', 'Test')
    .or('c_AutomationTool', '=', 'Axios')
    .and('Tags.Name', '!=', 'Outdated')
    .and('c_AutomationStatus', '!=', 'Complete')
    .and('c_AutomationStatus', '!=', 'Non-Candidate')
    .toQueryString();

const config = {
    method: "get", 
    url: "/project",
    params: {
        start: 1, 
        pagesize: 200,
        query: query
    }
};

```

### Query Parameters

Query URLs may use the following parameters.

- `query`
    - The query string is query=(FormattedID%20%3D%20S40330) in the example below.
    - Example: https://rally1.rallydev.com/slm/webservice/v2.0/hierarchicalrequirement?query=(FormattedID%20%3D%20S40330)

- `order`
    - A sort string which determines the order of the data returned. desc will present the data in descending order.
    - Example: order=Name desc

- `pagesize`
    -   Number of results to display on the page. Must be greater than 0 and less than or equal to 200 for 1.x API calls or 2000 for 2.x API calls. The default is 20.
    -   Example: pagesize=30

- `start`
    -   The start index for queries, which begins at 1. The default is 1.
    -   Example: start=1

- `fetch`
    -   A string value which determines the attributes present on the objects returned.
    -   Example: fetch=FormattedID,Name,Project,Parent

- `workspace`
    -   This parameter limits the search space to a specific workspace. If not specified, then the query will search the userʼs default workspace. When used, the workspace parameter is set to the URL of the workspace to be searched as shown in the example below. ‹Workspace ObjectID› should be set to the Object ID of the workspace.
    -   Example: workspace=https://rally1.rallydev.com/slm/webservice/v2.0/workspace/‹Workspace ObjectID›

- `project`
    -   This parameter limits the search space to a specific project. If not specified, then the query will run in the userʼs default project. The workspace parameter is not necessary when project is specified because the workspace will be inherited from the project. When used, the project parameter is set to the URL of the project to be searched as shown in the example below. ‹Project ObjectID› should be set to the Object ID of the project.
    - Example: project=https://rally1.rallydev.com/slm/webservice/v2.0/project/‹Project ObjectID›

- `projectScopeUp`
    - Include parent projects above the one specified. Default is true.
    - Example: projectScopeUp=false

- `projectScopeDown`
    - Include child projects below the specified one. Default is true.
    - Example: projectScopeDown=true

### PUT/POST Parameters

The following parameters only have an effect for PUT and POST requests.
-   `rankAbove`, `rankBelow`
    - Set the value to an object reference url to cause the created/modified object to be ranked in relation to the referenced object.
    - Example: rankAbove=/slm/webservice/v2.0/defect/<Defect ObjectID>
    - Example: rankBelow=/slm/webservice/v2.0/defect/<Defect ObjectID>


## Query Response

Data returned by Axios is wrapped in an object to provide the complete response or error contents.  The end user is responsible for extracting and using this data.

```
{
  response: {
    QueryResult: {
      _rallyAPIMajor: '2',
      _rallyAPIMinor: '0',
      Errors: [],
      Warnings: [],
      TotalResultCount: 662,
      StartIndex: 1,
      PageSize: 200,
      Results: [Array]
    }
  },
  error: null
}
```
Response or Error will be `null` if no data is set.  Check these values along with the response type such as `QueryResult` to further process the data.

The response from the Rally WSAPI may contain errors or warnings even if the response from the client is successful.

### Pagination

Because of the variety of response types that may be returned, automatic pagination is not provided.  But this can be implemented in your applcation by checking the `TotalResultCount` and `StartIndex`.  Simply update the start index value by the next page size and execute your query again.

In the example above, you would get back results 1-200, your next batch would then update `StartIndex` to 201 and so on to retrieve the complete data set.

```
const projects = [];

async function listProjects(inputs) {
  const data = await client.request({ method: "get", url: "/project", params: inputs });

  if (data.response) {
    const respObj = data.response.QueryResult;

    if (respObj.Results) {
      respObj.Results.forEach((res) => {
        if (!res._refObjectName.startsWith("z_")) {
          projects.push({ name: res._refObjectName, uuid: res._refObjectUUID });
        }
      });

      const nextPage = respObj.StartIndex + respObj.PageSize;

      if (nextPage <= respObj.TotalResultCount) {
        inputs.start = nextPage;
        await listProjects(inputs);
      }
    }
  }
}

(async function () {
  const inputs = { start: 1, pagesize: 200 };
  await listProjects(inputs);

  console.log(projects.length);
})();
```
