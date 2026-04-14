# Contributing
I'm very interested in making this useful for websites of all sizes, where one typing profile is shared everywhere for the library to access, so that websites which do not receive a lot of traffic may benefit from the user profiles accumulated from larger ones, or accross hundreds of smaller ones. My original idea was implementing a cookie which is cross-domain, but I have not found a solution that doesn't involve hosting a database and inserting an iframe, for which I do not have sufficient resources. If you have any ideas or resources which could lead to an implementation of this idea, *please* contact.

I am keen on improving the mathematics in this repository and storing more data which could lead to better approximations of debounce times. Additionally, I am interested in different approaches to better analyse the data received. Feel free to fork this repository and contact for assistance. 

## General Guidance

### Reporting issues

If you have found what you think is a bug, please [start a discussion](https://github.com/JUST1PO1NT0/typace/discussions/new?category=please-report-bugs-here).

For any usage questions, please [start a discussion](https://github.com/JUST1PO1NT0/typace/discussions/new?category=q-a)

### Suggesting new features

If you are here to suggest a feature, [start a discussion](https://github.com/JUST1PO1NT0/typace/discussions/categories/ideas) first, *if it does not exist*.

### Committing

[Convetional commit spec](https://www.conventionalcommits.org/en/v1.0.0/) applies in this repository. In short, that means a commit has to be one of the following types:

- **feat**: A new feature.
- **fix**: A bug fix.
- **refactor**: A code change that neither fixes a bug nor adds a feature.
- **chore**: Changes to the build process, configuration, dependencies, CI/CD pipelines, or other auxiliary tools and libraries.
- **docs**: Documentation-only changes.
- **test**: Adding missing or correcting existing tests.

If you are unfamiliar with the usage of conventional commits,
the short version is to simply specify the type as a first word,
and follow it with a colon and a space, then start your message
from a lowercase letter, like this:

```
feat: add a 'foo' type support
```

You can also specify the scope of the commit in the parentheses after a type:

```
fix(react): change the 'bar' parameter type
```

### Development

If you would like to contribute by fixing an open issue or developing a new feature you can use this suggested workflow:

#### General

1. Fork this repository.
2. Create a new feature branch based off the `main` branch.
3. Follow the [Core](#Core) guide below and come back to this once done.
4. Git stage your required changes and commit (review the commit guidelines below).
5. Submit the PR for review.

##### Core

1. Run `npm install` to install dependencies.
2. Create failing tests for your fix or new feature in the [`tests`](./test/) folder.
3. Implement your changes.
4. Run `npm run build` to build the library.
5. Run the tests by running `npm run test` and ensure that they pass.
6. You can use `npm link` to sym-link this package and test it locally on your own project. Alternatively, you may use CodeSandbox CI's canary releases to test the changes in your own project. (requires a PR to be created first)
7. Follow step 4 and onwards from the [General](#General) guide above to bring it to the finish line.

### Pull Requests

Please try to keep your pull request focused in scope and avoid including unrelated commits.

After you have submitted your pull request, we'll try to get back to you as soon as possible. We may suggest some changes or request improvements, therefore, please check ✅ ["Allow edits from maintainers"](https://docs.github.com/en/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/creating-a-pull-request-from-a-fork) on your PR.