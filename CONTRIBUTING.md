# Contributing to uMdali

First off, thank you for considering contributing to uMdali. It's people like you that make uMdali such a great tool.

## Code of Conduct
This project and everyone participating in it is governed by the uMdali Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [umdaliapp@gmail.com].

## What Should I Know Before I Get Started?
### Project Structure
Briefly explain the structure of your project. For instance, where the core logic is, where the tests are, and any other relevant architectural details.

### Dependencies
List any dependencies required to run your project and how to install them.

## How Can I Contribute?
### Reporting Bugs
This section guides people through submitting a bug report. Use the following as a template:

**Before Submitting A Bug Report:**
- Ensure the bug was not already reported by searching on GitHub under [Issues](https://github.com/brett-baudin-consulting/uMdali/issues).
- If you're unable to find an open issue addressing the problem, open a new one. Be sure to include a title and clear description, as much relevant information as possible, and a code sample or an executable test case demonstrating the expected behavior that is not occurring.

Certainly! Below is a markdown-formatted section for your README that explains how to submit a good bug report, including an example.

## How Do I Submit A (Good) Bug Report?

Bugs are an inevitable part of any software development process, and your contributions to identifying and reporting them are invaluable to the improvement of the project. To submit a bug report, we use [GitHub issues](https://github.com/brett-baudin-consulting/uMdali/issues). A good bug report should be detailed, specific, and reproducible. Here's how you can write an effective bug report:

### Steps to Submit a Bug Report

1. **Check Existing Issues**: Before submitting your bug report, please check the repository's issues to ensure the bug has not been reported already. If you find that your issue is already reported, you can add any additional information you have to the existing report.

2. **Create a New Issue**: If the bug hasn't been reported yet, go ahead and create a new issue. Use a clear and descriptive title for the issue to help others understand the problem at a glance.

3. **Write a Detailed Report**: In the body of the issue, please provide the following information:
   - **Environment**: Specify the operating system, software version, and any other relevant environmental information.
   - **Steps to Reproduce**: List the steps that lead to the bug. Be as specific as possible.
   - **Expected Behavior**: Describe what you expected to happen when you carried out the steps above.
   - **Actual Behavior**: Explain what actually happened. Include any error messages or screenshots if possible.
   - **Additional Information**: Add any other context about the problem here.

### Example Bug Report

Title: Crash on launching the application with empty profile

Environment:
- OS: Windows 10 Pro, Version 2004
- uMdali Version: 1.2.5
- Last known working uMdali Version: 1.2.3

Steps to Reproduce:
1. Start uMdali with a new installation or remove the existing profile configuration.
2. Click on 'File' > 'New Profile'.
3. Leave the profile name empty and click 'OK'.

Expected Behavior:
The application should prompt for a valid profile name or use a default one.

Actual Behavior:
The application crashes with the error message "Unhandled exception: Profile name cannot be empty."

Additional Information:
- The issue does not occur when a default profile name is manually entered.
- Attached is the log file and a screenshot of the error.

![Error Screenshot](url-to-screenshot)
[Log File](url-to-log-file)

By following these guidelines, you will provide us with the necessary information to understand, replicate, and ultimately fix the bug. We appreciate your help in making uMdali better for everyone!


### Suggesting Enhancements
This section guides users through submitting an enhancement suggestion, including completely new features and minor improvements to existing functionality.

**Before Submitting An Enhancement Suggestion:**
- Check the issue tracker to ensure the suggestion hasn't already been made.
- Clearly outline the motivation for the change and how it benefits the project.

**How Do I Submit A (Good) Enhancement Suggestion?**
Enhancement suggestions are tracked as GitHub issues. Use the following template to guide the suggestion:

[Short description of suggestion]

[Benefits of suggestion]

[Code sample that demonstrates the enhancement]

[Include any other relevant details]

### Your First Code Contribution
Unsure where to begin contributing to uMdali? You can start by looking through `beginner` and `help-wanted` issues:

- Beginner issues - issues which should only require a few lines of code, and a test or two.
- Help wanted issues - issues which should be a bit more involved than `beginner` issues.

Both issue lists are sorted by total number of comments. While not perfect, number of comments is a reasonable proxy for impact a given change will have.

### Pull Requests
The process described here has several goals:
- Maintain uMdali's quality
- Fix problems that are important to users
- Engage the community in working toward the best possible uMdali
- Enable a sustainable system for uMdali's maintainers to review contributions

Please follow these steps to have your contribution considered by the maintainers:

1. Follow all instructions in [the template](PULL_REQUEST_TEMPLATE.md)
2. Follow the [styleguides](#styleguides)
3. After you submit your pull request, verify that all [status checks](https://help.github.com/articles/about-status-checks/) are passing

While the prerequisites above must be satisfied prior to having your pull request reviewed, the reviewer(s) may ask you to complete additional design work, tests, or other changes before your pull request can be ultimately accepted.

## Styleguides
### Git Commit Messages
- Use the present tense ("Add feature" not "Added feature")
- Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
- Limit the first line to 72 characters or less
- Reference issues and pull requests liberally after the first line
- Consider starting the commit message with an applicable emoji:
    - :art: `:art:` when improving the format/structure of the code
    - :racehorse: `:racehorse:` when improving performance
    - :memo: `:memo:` when writing docs
    - :penguin: `:penguin:` when fixing something on Linux
    - :apple: `:apple:` when fixing something on macOS
    - :checkered_flag: `:checkered_flag:` when fixing something on Windows
    - :bug: `:bug:` when fixing a bug
    - :fire: `:fire:` when removing code or files
    - :green_heart: `:green_heart:` when fixing the CI build
    - :white_check_mark: `:white_check_mark:` when adding tests
    - :lock: `:lock:` when dealing with security
    - :rotating_light: `:rotating_light:` when removing linter warnings

### JavaScript Styleguide
All JavaScript must adhere to [JavaScript Standard Style](https://standardjs.com/).

### CSS Styleguide
Use [SCSS](https://sass-lang.com/guide/) 

## Additional Notes
### Issue and Pull Request Labels
This section lists the labels we use to help us track and manage issues and pull requests. While not super important, it can be helpful for contributors to understand the labeling system.

## Conclusion
Your contributions to uMdali are greatly appreciated. Following these guidelines helps to communicate that you respect the time of the developers managing and developing this open source project. In return, they should reciprocate that respect in addressing your issue, assessing changes, and helping you finalize your pull requests.

uMdali is a volunteer effort. We encourage you to pitch in and join the team!

Thanks!

uMdali Team
